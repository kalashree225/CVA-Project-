"""Workflow router for workflow orchestration endpoints."""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel

from app.workflows.models import (
    Workflow,
    WorkflowStep,
    WorkflowExecution,
    WorkflowStatus,
    StepType,
)
from app.workflows.engine import workflow_engine
from app.workflows.templates import (
    get_all_templates,
    get_template_by_id,
    get_templates_by_category,
)
from app.database import get_db

router = APIRouter(prefix="/api/v1/workflows", tags=["workflows"])


# Request/Response Models
class CreateWorkflowRequest(BaseModel):
    name: str
    description: Optional[str] = None
    steps: List[dict]
    created_by: str
    tags: List[str] = []


class ExecuteWorkflowRequest(BaseModel):
    workflow_id: str
    input_data: dict
    triggered_by: str


class WorkflowExecutionResponse(BaseModel):
    execution_id: str
    workflow_id: str
    status: WorkflowStatus
    started_at: Optional[str]
    completed_at: Optional[str]
    output_data: Optional[dict]
    error_message: Optional[str]


@router.get("/templates")
async def get_workflow_templates(
    category: Optional[str] = Query(None)
):
    """Get all available workflow templates."""
    try:
        if category:
            templates = get_templates_by_category(category)
        else:
            templates = get_all_templates()
        return {
            "templates": [t.dict() for t in templates],
            "count": len(templates)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/{template_id}")
async def get_workflow_template(template_id: str):
    """Get a specific workflow template by ID."""
    try:
        template = get_template_by_id(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return template.dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute")
async def execute_workflow(request: ExecuteWorkflowRequest):
    """
    Execute a workflow with given input data.
    
    Returns the workflow execution with results.
    """
    try:
        # In a real implementation, you would fetch the workflow from database
        # For now, we'll create a simple workflow from the request
        
        steps = []
        for step_data in request.input_data.get("steps", []):
            step = WorkflowStep(
                id=step_data.get("id", "step"),
                name=step_data.get("name", "Step"),
                type=StepType(step_data.get("type", "inference")),
                config=step_data.get("config", {}),
                dependencies=step_data.get("dependencies", []),
                retry_count=step_data.get("retry_count", 0)
            )
            steps.append(step)
        
        workflow = Workflow(
            id=request.workflow_id,
            name=request.input_data.get("name", "Workflow"),
            steps=steps,
            created_by=request.triggered_by
        )
        
        execution = await workflow_engine.execute_workflow(
            workflow=workflow,
            input_data=request.input_data,
            triggered_by=request.triggered_by
        )
        
        return execution.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/executions/{execution_id}")
async def get_workflow_execution(execution_id: str):
    """Get status of a workflow execution."""
    try:
        execution = workflow_engine.get_execution_status(execution_id)
        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")
        return execution.dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create")
async def create_workflow(request: CreateWorkflowRequest):
    """Create a new workflow."""
    try:
        steps = []
        for step_data in request.steps:
            step = WorkflowStep(
                id=step_data.get("id", "step"),
                name=step_data.get("name", "Step"),
                type=StepType(step_data.get("type", "inference")),
                config=step_data.get("config", {}),
                dependencies=step_data.get("dependencies", []),
                conditions=step_data.get("conditions"),
                retry_count=step_data.get("retry_count", 0),
                timeout_seconds=step_data.get("timeout_seconds")
            )
            steps.append(step)
        
        workflow = Workflow(
            id=f"workflow_{hash(request.name)}",  # Simple ID generation
            name=request.name,
            description=request.description,
            steps=steps,
            created_by=request.created_by,
            tags=request.tags
        )
        
        # In a real implementation, save to database
        return {
            "workflow_id": workflow.id,
            "name": workflow.name,
            "status": "created",
            "steps_count": len(steps)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_workflow_categories():
    """Get all workflow template categories."""
    try:
        templates = get_all_templates()
        categories = list(set(t.category for t in templates))
        return {
            "categories": sorted(categories),
            "count": len(categories)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
