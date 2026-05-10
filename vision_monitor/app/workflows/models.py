"""Workflow models for workflow orchestration."""

from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
from pydantic import BaseModel, Field


class StepType(str, Enum):
    """Types of workflow steps."""
    INFERENCE = "inference"
    EVALUATION = "evaluation"
    TRANSFORMATION = "transformation"
    CONDITIONAL = "conditional"
    PARALLEL = "parallel"
    AGGREGATION = "aggregation"
    NOTIFICATION = "notification"
    CUSTOM = "custom"


class StepStatus(str, Enum):
    """Status of a workflow step."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class WorkflowStatus(str, Enum):
    """Status of a workflow execution."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class WorkflowStep(BaseModel):
    """A single step in a workflow."""
    id: str = Field(..., description="Unique step identifier")
    name: str = Field(..., description="Step name")
    type: StepType = Field(..., description="Step type")
    config: Dict[str, Any] = Field(default_factory=dict, description="Step configuration")
    dependencies: List[str] = Field(default_factory=list, description="Step IDs this step depends on")
    conditions: Optional[Dict[str, Any]] = Field(None, description="Conditions for execution")
    retry_count: int = Field(default=0, description="Number of retries on failure")
    timeout_seconds: Optional[int] = Field(None, description="Step timeout in seconds")


class Workflow(BaseModel):
    """A workflow definition."""
    id: str = Field(..., description="Unique workflow identifier")
    name: str = Field(..., description="Workflow name")
    description: Optional[str] = Field(None, description="Workflow description")
    steps: List[WorkflowStep] = Field(..., description="Workflow steps")
    version: int = Field(default=1, description="Workflow version")
    created_by: str = Field(..., description="User ID who created the workflow")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    is_active: bool = Field(default=True, description="Whether workflow is active")
    tags: List[str] = Field(default_factory=list, description="Workflow tags")


class WorkflowExecution(BaseModel):
    """A workflow execution instance."""
    id: str = Field(..., description="Unique execution identifier")
    workflow_id: str = Field(..., description="Workflow ID")
    workflow_version: int = Field(..., description="Workflow version at execution time")
    status: WorkflowStatus = Field(default=WorkflowStatus.PENDING, description="Execution status")
    started_at: Optional[datetime] = Field(None, description="Start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")
    input_data: Dict[str, Any] = Field(default_factory=dict, description="Input data for execution")
    output_data: Dict[str, Any] = Field(default_factory=dict, description="Output data from execution")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    step_results: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="Results per step")
    triggered_by: str = Field(..., description="User ID who triggered execution")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class WorkflowTemplate(BaseModel):
    """A reusable workflow template."""
    id: str = Field(..., description="Unique template identifier")
    name: str = Field(..., description="Template name")
    description: str = Field(..., description="Template description")
    category: str = Field(..., description="Template category")
    steps: List[WorkflowStep] = Field(..., description="Template steps")
    default_config: Dict[str, Any] = Field(default_factory=dict, description="Default configuration")
    icon: Optional[str] = Field(None, description="Template icon")
    is_public: bool = Field(default=True, description="Whether template is public")
