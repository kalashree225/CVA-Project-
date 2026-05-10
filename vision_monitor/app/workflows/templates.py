"""Pre-built workflow templates for common use cases."""

from app.workflows.models import WorkflowTemplate, WorkflowStep, StepType


# Image Classification Pipeline
IMAGE_CLASSIFICATION_TEMPLATE = WorkflowTemplate(
    id="img-class-pipeline",
    name="Image Classification Pipeline",
    description="Complete pipeline for image classification with evaluation",
    category="vision",
    steps=[
        WorkflowStep(
            id="inference",
            name="Image Inference",
            type=StepType.INFERENCE,
            config={
                "model_name": "llava-1.5",
                "input_type": "image",
                "input_image_url": "{{input.image_url}}"
            }
        ),
        WorkflowStep(
            id="evaluation",
            name="Quality Evaluation",
            type=StepType.EVALUATION,
            dependencies=["inference"],
            config={}
        ),
        WorkflowStep(
            id="notification",
            name="Send Notification",
            type=StepType.NOTIFICATION,
            dependencies=["evaluation"],
            config={
                "type": "alert",
                "message": "Image classification completed"
            }
        )
    ],
    default_config={
        "model_name": "llava-1.5",
        "notify_on_completion": True
    },
    icon="🖼️"
)

# Object Detection Pipeline
OBJECT_DETECTION_TEMPLATE = WorkflowTemplate(
    id="obj-detect-pipeline",
    name="Object Detection Pipeline",
    description="Pipeline for object detection with confidence scoring",
    category="vision",
    steps=[
        WorkflowStep(
            id="inference",
            name="Object Detection",
            type=StepType.INFERENCE,
            config={
                "model_name": "gpt-4-vision",
                "input_type": "image",
                "input_image_url": "{{input.image_url}}"
            }
        ),
        WorkflowStep(
            id="transformation",
            name="Extract Bounding Boxes",
            type=StepType.TRANSFORMATION,
            dependencies=["inference"],
            config={
                "type": "extract",
                "field": "bounding_boxes",
                "source_key": "steps.inference"
            }
        ),
        WorkflowStep(
            id="evaluation",
            name="Confidence Evaluation",
            type=StepType.EVALUATION,
            dependencies=["transformation"],
            config={}
        )
    ],
    default_config={
        "model_name": "gpt-4-vision",
        "min_confidence": 0.8
    },
    icon="🔍"
)

# Text Generation Pipeline
TEXT_GENERATION_TEMPLATE = WorkflowTemplate(
    id="text-gen-pipeline",
    name="Text Generation Pipeline",
    description="Pipeline for text generation with hallucination detection",
    category="nlp",
    steps=[
        WorkflowStep(
            id="inference",
            name="Text Generation",
            type=StepType.INFERENCE,
            config={
                "model_name": "gpt-4",
                "input_type": "text",
                "input_text": "{{input.prompt}}"
            }
        ),
        WorkflowStep(
            id="evaluation",
            name="Hallucination Check",
            type=StepType.EVALUATION,
            dependencies=["inference"],
            config={}
        ),
        WorkflowStep(
            id="conditional",
            name="Quality Check",
            type=StepType.CONDITIONAL,
            dependencies=["evaluation"],
            config={
                "condition": {"steps.evaluation.hallucination_score": 0.5},
                "true_path": "approve",
                "false_path": "review"
            }
        )
    ],
    default_config={
        "model_name": "gpt-4",
        "max_hallucination_score": 0.5
    },
    icon="📝"
)

# Multi-modal Analysis Pipeline
MULTIMODAL_TEMPLATE = WorkflowTemplate(
    id="multimodal-pipeline",
    name="Multi-modal Analysis Pipeline",
    description="Pipeline for analyzing text and image together",
    category="multimodal",
    steps=[
        WorkflowStep(
            id="text_inference",
            name="Text Analysis",
            type=StepType.INFERENCE,
            config={
                "model_name": "gpt-4",
                "input_type": "text",
                "input_text": "{{input.text}}"
            }
        ),
        WorkflowStep(
            id="image_inference",
            name="Image Analysis",
            type=StepType.INFERENCE,
            config={
                "model_name": "gpt-4-vision",
                "input_type": "image",
                "input_image_url": "{{input.image_url}}"
            }
        ),
        WorkflowStep(
            id="aggregation",
            name="Combine Results",
            type=StepType.AGGREGATION,
            dependencies=["text_inference", "image_inference"],
            config={
                "type": "map",
                "source_keys": ["steps.text_inference", "steps.image_inference"]
            }
        ),
        WorkflowStep(
            id="evaluation",
            name="Final Evaluation",
            type=StepType.EVALUATION,
            dependencies=["aggregation"],
            config={}
        )
    ],
    default_config={
        "text_model": "gpt-4",
        "vision_model": "gpt-4-vision"
    },
    icon="🎭"
)

# Batch Processing Pipeline
BATCH_PROCESSING_TEMPLATE = WorkflowTemplate(
    id="batch-process-pipeline",
    name="Batch Processing Pipeline",
    description="Process multiple inputs in parallel",
    category="batch",
    steps=[
        WorkflowStep(
            id="batch_inference",
            name="Batch Inference",
            type=StepType.INFERENCE,
            config={
                "model_name": "llava-1.5",
                "input_type": "text",
                "input_text": "{{input.batch_text}}"
            },
            retry_count=3
        ),
        WorkflowStep(
            id="aggregation",
            name="Aggregate Results",
            type=StepType.AGGREGATION,
            dependencies=["batch_inference"],
            config={
                "type": "mean",
                "source_keys": ["steps.batch_inference.latency_ms"]
            }
        )
    ],
    default_config={
        "model_name": "llava-1.5",
        "batch_size": 10
    },
    icon="📦"
)

# A/B Testing Pipeline
AB_TESTING_TEMPLATE = WorkflowTemplate(
    id="ab-test-pipeline",
    name="A/B Testing Pipeline",
    description="Compare two models on the same input",
    category="testing",
    steps=[
        WorkflowStep(
            id="model_a",
            name="Model A Inference",
            type=StepType.INFERENCE,
            config={
                "model_name": "llava-1.5",
                "input_type": "{{input.input_type}}",
                "input_text": "{{input.input_text}}",
                "input_image_url": "{{input.image_url}}"
            }
        ),
        WorkflowStep(
            id="model_b",
            name="Model B Inference",
            type=StepType.INFERENCE,
            config={
                "model_name": "gpt-4-vision",
                "input_type": "{{input.input_type}}",
                "input_text": "{{input.input_text}}",
                "input_image_url": "{{input.image_url}}"
            }
        ),
        WorkflowStep(
            id="comparison",
            name="Compare Results",
            type=StepType.AGGREGATION,
            dependencies=["model_a", "model_b"],
            config={
                "type": "map",
                "source_keys": ["steps.model_a", "steps.model_b"]
            }
        ),
        WorkflowStep(
            id="evaluation",
            name="Evaluate Both",
            type=StepType.EVALUATION,
            dependencies=["comparison"],
            config={}
        )
    ],
    default_config={
        "model_a": "llava-1.5",
        "model_b": "gpt-4-vision"
    },
    icon="🧪"
)

# Cost Optimization Pipeline
COST_OPTIMIZATION_TEMPLATE = WorkflowTemplate(
    id="cost-opt-pipeline",
    name="Cost Optimization Pipeline",
    description="Find the most cost-effective model for a task",
    category="optimization",
    steps=[
        WorkflowStep(
            id="model_1",
            name="Fast Model Inference",
            type=StepType.INFERENCE,
            config={
                "model_name": "llava-1.5",
                "input_type": "{{input.input_type}}",
                "input_text": "{{input.input_text}}",
                "input_image_url": "{{input.image_url}}"
            }
        ),
        WorkflowStep(
            id="model_2",
            name="Premium Model Inference",
            type=StepType.INFERENCE,
            config={
                "model_name": "gpt-4-vision",
                "input_type": "{{input.input_type}}",
                "input_text": "{{input.input_text}}",
                "input_image_url": "{{input.image_url}}"
            }
        ),
        WorkflowStep(
            id="cost_comparison",
            name="Compare Costs",
            type=StepType.AGGREGATION,
            dependencies=["model_1", "model_2"],
            config={
                "type": "map",
                "source_keys": ["steps.model_1.cost_usd", "steps.model_2.cost_usd"]
            }
        ),
        WorkflowStep(
            id="recommendation",
            name="Generate Recommendation",
            type=StepType.TRANSFORMATION,
            dependencies=["cost_comparison"],
            config={
                "type": "filter",
                "source_key": "steps.cost_comparison"
            }
        )
    ],
    default_config={
        "fast_model": "llava-1.5",
        "premium_model": "gpt-4-vision"
    },
    icon="💰"
)


def get_all_templates() -> list[WorkflowTemplate]:
    """Get all available workflow templates."""
    return [
        IMAGE_CLASSIFICATION_TEMPLATE,
        OBJECT_DETECTION_TEMPLATE,
        TEXT_GENERATION_TEMPLATE,
        MULTIMODAL_TEMPLATE,
        BATCH_PROCESSING_TEMPLATE,
        AB_TESTING_TEMPLATE,
        COST_OPTIMIZATION_TEMPLATE
    ]


def get_template_by_id(template_id: str) -> WorkflowTemplate | None:
    """Get a workflow template by ID."""
    for template in get_all_templates():
        if template.id == template_id:
            return template
    return None


def get_templates_by_category(category: str) -> list[WorkflowTemplate]:
    """Get workflow templates by category."""
    return [t for t in get_all_templates() if t.category == category]
