"""Workflow engine for orchestrating inference pipelines."""

import logging
import uuid
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional, Callable
from collections import defaultdict, deque

from app.workflows.models import (
    Workflow,
    WorkflowStep,
    WorkflowExecution,
    StepStatus,
    WorkflowStatus,
    StepType,
)
from app.services.inference_service import InferenceService
from app.services.eval_service import EvalService
from app.services.alert_service import AlertService

logger = logging.getLogger(__name__)


class WorkflowEngine:
    """Engine for executing and managing workflows."""
    
    def __init__(self):
        self.active_executions: Dict[str, WorkflowExecution] = {}
        self.step_handlers: Dict[StepType, Callable] = {
            StepType.INFERENCE: self._handle_inference_step,
            StepType.EVALUATION: self._handle_evaluation_step,
            StepType.TRANSFORMATION: self._handle_transformation_step,
            StepType.CONDITIONAL: self._handle_conditional_step,
            StepType.AGGREGATION: self._handle_aggregation_step,
            StepType.NOTIFICATION: self._handle_notification_step,
        }
    
    async def execute_workflow(
        self,
        workflow: Workflow,
        input_data: Dict[str, Any],
        triggered_by: str
    ) -> WorkflowExecution:
        """
        Execute a workflow with given input data.
        
        Returns the workflow execution with results.
        """
        execution_id = str(uuid.uuid4())
        
        execution = WorkflowExecution(
            id=execution_id,
            workflow_id=workflow.id,
            workflow_version=workflow.version,
            input_data=input_data,
            triggered_by=triggered_by,
        )
        
        self.active_executions[execution_id] = execution
        execution.status = WorkflowStatus.RUNNING
        execution.started_at = datetime.utcnow()
        
        logger.info(f"Starting workflow execution: {execution_id}")
        
        try:
            # Build dependency graph
            step_graph = self._build_step_graph(workflow.steps)
            
            # Execute steps in topological order
            execution_results = await self._execute_steps(
                workflow.steps,
                step_graph,
                execution,
                input_data
            )
            
            execution.output_data = execution_results
            execution.status = WorkflowStatus.COMPLETED
            execution.completed_at = datetime.utcnow()
            
            logger.info(f"Workflow execution completed: {execution_id}")
            
        except Exception as e:
            execution.status = WorkflowStatus.FAILED
            execution.error_message = str(e)
            execution.completed_at = datetime.utcnow()
            logger.error(f"Workflow execution failed: {execution_id} - {e}")
        
        finally:
            if execution_id in self.active_executions:
                del self.active_executions[execution_id]
        
        return execution
    
    def _build_step_graph(self, steps: List[WorkflowStep]) -> Dict[str, List[str]]:
        """Build dependency graph from workflow steps."""
        graph = defaultdict(list)
        in_degree = defaultdict(int)
        
        # Initialize all steps
        for step in steps:
            in_degree[step.id] = 0
        
        # Build edges
        for step in steps:
            for dep in step.dependencies:
                graph[dep].append(step.id)
                in_degree[step.id] += 1
        
        return {"graph": graph, "in_degree": in_degree}
    
    async def _execute_steps(
        self,
        steps: List[WorkflowStep],
        step_graph: Dict[str, Any],
        execution: WorkflowExecution,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute workflow steps in dependency order."""
        graph = step_graph["graph"]
        in_degree = step_graph["in_degree"]
        
        # Create step lookup
        step_map = {step.id: step for step in steps}
        
        # Initialize queue with steps having no dependencies
        queue = deque([step_id for step_id, degree in in_degree.items() if degree == 0])
        results = {}
        context = {"input": input_data, "steps": {}}
        
        while queue:
            step_id = queue.popleft()
            step = step_map[step_id]
            
            # Execute step
            step_result = await self._execute_step(step, context, execution)
            context["steps"][step_id] = step_result
            results[step_id] = step_result
            
            execution.step_results[step_id] = {
                "status": "completed",
                "result": step_result,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Update in-degree for dependent steps
            for dependent_id in graph[step_id]:
                in_degree[dependent_id] -= 1
                if in_degree[dependent_id] == 0:
                    queue.append(dependent_id)
        
        return {"context": context, "results": results}
    
    async def _execute_step(
        self,
        step: WorkflowStep,
        context: Dict[str, Any],
        execution: WorkflowExecution
    ) -> Any:
        """Execute a single workflow step."""
        handler = self.step_handlers.get(step.type)
        
        if not handler:
            logger.warning(f"No handler for step type: {step.type}")
            return None
        
        # Check conditions
        if step.conditions and not self._evaluate_conditions(step.conditions, context):
            logger.info(f"Step {step.id} skipped due to conditions")
            return None
        
        # Execute with retry logic
        max_retries = step.retry_count
        last_error = None
        
        for attempt in range(max_retries + 1):
            try:
                result = await handler(step, context, execution)
                return result
            except Exception as e:
                last_error = e
                logger.warning(f"Step {step.id} failed (attempt {attempt + 1}/{max_retries + 1}): {e}")
                if attempt < max_retries:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        raise Exception(f"Step {step.id} failed after {max_retries + 1} attempts: {last_error}")
    
    def _evaluate_conditions(self, conditions: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """Evaluate whether conditions are met for step execution."""
        # Simple condition evaluation - can be extended
        for key, expected in conditions.items():
            actual = self._get_nested_value(context, key)
            if actual != expected:
                return False
        return True
    
    def _get_nested_value(self, data: Dict[str, Any], key: str) -> Any:
        """Get nested value from dictionary using dot notation."""
        keys = key.split(".")
        value = data
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                return None
        return value
    
    async def _handle_inference_step(
        self,
        step: WorkflowStep,
        context: Dict[str, Any],
        execution: WorkflowExecution
    ) -> Dict[str, Any]:
        """Handle inference step."""
        config = step.config
        model_name = config.get("model_name", "llava-1.5")
        input_type = config.get("input_type", "text")
        input_text = config.get("input_text")
        input_image_url = config.get("input_image_url")
        
        # Use context variables if not provided
        if not input_text and "input_text" in context["input"]:
            input_text = context["input"]["input_text"]
        
        logger.info(f"Executing inference step: {step.id} with model {model_name}")
        
        # Call inference service
        result = await InferenceService.create_inference(
            model_name=model_name,
            input_type=input_type,
            input_text=input_text,
            input_image_url=input_image_url
        )
        
        return {
            "run_id": result.get("id"),
            "model_name": model_name,
            "output": result.get("output_text"),
            "latency_ms": result.get("latency_ms"),
            "status": result.get("status")
        }
    
    async def _handle_evaluation_step(
        self,
        step: WorkflowStep,
        context: Dict[str, Any],
        execution: WorkflowExecution
    ) -> Dict[str, Any]:
        """Handle evaluation step."""
        config = step.config
        run_id = config.get("run_id")
        
        # Get run_id from context if not provided
        if not run_id:
            for step_id, step_result in context["steps"].items():
                if isinstance(step_result, dict) and "run_id" in step_result:
                    run_id = step_result["run_id"]
                    break
        
        if not run_id:
            raise ValueError("No run_id found for evaluation")
        
        logger.info(f"Executing evaluation step: {step.id} for run {run_id}")
        
        # Call evaluation service
        result = await EvalService.evaluate_run(run_id)
        
        return {
            "run_id": run_id,
            "hallucination_score": result.get("hallucination_score"),
            "quality_score": result.get("quality_score"),
            "metrics": result.get("metrics", {})
        }
    
    async def _handle_transformation_step(
        self,
        step: WorkflowStep,
        context: Dict[str, Any],
        execution: WorkflowExecution
    ) -> Dict[str, Any]:
        """Handle data transformation step."""
        config = step.config
        transform_type = config.get("type", "identity")
        source_key = config.get("source_key")
        
        # Get source data from context
        source_data = self._get_nested_value(context, source_key) if source_key else context
        
        logger.info(f"Executing transformation step: {step.id} of type {transform_type}")
        
        # Apply transformation
        if transform_type == "identity":
            result = source_data
        elif transform_type == "extract":
            field = config.get("field")
            result = source_data.get(field) if isinstance(source_data, dict) else source_data
        elif transform_type == "map":
            mapping = config.get("mapping", {})
            result = {k: source_data.get(v) for k, v in mapping.items()}
        elif transform_type == "filter":
            predicate = config.get("predicate")
            if isinstance(source_data, list):
                result = [item for item in source_data if item.get(predicate)]
            else:
                result = source_data
        else:
            result = source_data
        
        return {"transformed_data": result}
    
    async def _handle_conditional_step(
        self,
        step: WorkflowStep,
        context: Dict[str, Any],
        execution: WorkflowExecution
    ) -> Dict[str, Any]:
        """Handle conditional branching step."""
        config = step.config
        condition = config.get("condition")
        true_path = config.get("true_path")
        false_path = config.get("false_path")
        
        # Evaluate condition
        condition_met = self._evaluate_conditions(condition, context)
        
        logger.info(f"Conditional step {step.id}: condition_met={condition_met}")
        
        return {
            "condition_met": condition_met,
            "path": true_path if condition_met else false_path
        }
    
    async def _handle_aggregation_step(
        self,
        step: WorkflowStep,
        context: Dict[str, Any],
        execution: WorkflowExecution
    ) -> Dict[str, Any]:
        """Handle aggregation step."""
        config = step.config
        aggregation_type = config.get("type", "mean")
        source_keys = config.get("source_keys", [])
        
        # Collect values from context
        values = []
        for key in source_keys:
            value = self._get_nested_value(context, key)
            if value is not None:
                values.append(value)
        
        logger.info(f"Executing aggregation step: {step.id} of type {aggregation_type}")
        
        # Apply aggregation
        if aggregation_type == "mean" and values:
            result = sum(values) / len(values)
        elif aggregation_type == "sum" and values:
            result = sum(values)
        elif aggregation_type == "max" and values:
            result = max(values)
        elif aggregation_type == "min" and values:
            result = min(values)
        elif aggregation_type == "count":
            result = len(values)
        else:
            result = None
        
        return {
            "aggregation_type": aggregation_type,
            "result": result,
            "count": len(values)
        }
    
    async def _handle_notification_step(
        self,
        step: WorkflowStep,
        context: Dict[str, Any],
        execution: WorkflowExecution
    ) -> Dict[str, Any]:
        """Handle notification step."""
        config = step.config
        notification_type = config.get("type", "log")
        message = config.get("message", "Workflow step completed")
        
        logger.info(f"Notification step {step.id}: {notification_type}")
        
        if notification_type == "log":
            logger.info(f"Workflow notification: {message}")
        elif notification_type == "alert":
            # Create alert
            await AlertService.create_alert_rule(
                name=f"Workflow Alert: {execution.id}",
                metric="custom",
                operator="eq",
                threshold=1,
                webhook_url=config.get("webhook_url")
            )
        
        return {"notification_sent": True, "type": notification_type}
    
    def get_execution_status(self, execution_id: str) -> Optional[WorkflowExecution]:
        """Get status of a workflow execution."""
        return self.active_executions.get(execution_id)


# Global workflow engine instance
workflow_engine = WorkflowEngine()
