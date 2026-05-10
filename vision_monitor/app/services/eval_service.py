import random
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.run import InferenceRun, RunStatus
from app.models.evaluation import EvaluationResult
from app.config import settings
import uuid

logger = logging.getLogger(__name__)


class EvalService:
    """Service for hallucination evaluation (mock Ragas-style)."""
    
    @staticmethod
    def generate_mock_scores(output_text: str) -> dict:
        """Generate mock evaluation scores biased by output characteristics."""
        output_length = len(output_text)
        
        # Bias scores based on output length (longer outputs tend to have lower faithfulness)
        faithfulness_bias = max(0.0, 1.0 - (output_length / 1000))
        faithfulness = random.uniform(0.6 + faithfulness_bias * 0.3, 1.0)
        
        answer_relevancy = random.uniform(0.5, 1.0)
        context_recall = random.uniform(0.4, 1.0)
        
        return {
            "faithfulness": faithfulness,
            "answer_relevancy": answer_relevancy,
            "context_recall": context_recall
        }
    
    @staticmethod
    def compute_hallucination_score(scores: dict) -> float:
        """Compute composite hallucination score from individual metrics."""
        avg_score = sum(scores.values()) / len(scores)
        hallucination_score = 1.0 - avg_score
        return round(hallucination_score, 4)
    
    @staticmethod
    async def evaluate_run(db: AsyncSession, run_id: uuid.UUID) -> dict:
        """Run evaluation for a given run and save results."""
        # Get the run
        result = await db.execute(select(InferenceRun).where(InferenceRun.id == run_id))
        run = result.scalar_one_or_none()
        
        if not run:
            logger.warning(f"Run {run_id} not found for evaluation")
            return {}
        
        # Generate mock scores
        scores = EvalService.generate_mock_scores(run.output_text)
        hallucination_score = EvalService.compute_hallucination_score(scores)
        
        # Save individual metrics
        for metric_name, score in scores.items():
            eval_result = EvaluationResult(
                id=uuid.uuid4(),
                run_id=run_id,
                metric_name=metric_name,
                score=score,
                explanation=f"Mock evaluation for {metric_name}"
            )
            db.add(eval_result)
        
        # Update run with hallucination score
        run.hallucination_score = hallucination_score
        run.status = RunStatus.SUCCESS
        
        await db.commit()
        
        logger.info(f"Evaluated run {run_id}, hallucination_score={hallucination_score}")
        
        return {
            "hallucination_score": hallucination_score,
            "scores": scores
        }
    
    @staticmethod
    async def get_evaluations(db: AsyncSession, run_id: uuid.UUID) -> list[EvaluationResult]:
        """Get all evaluations for a run."""
        result = await db.execute(
            select(EvaluationResult).where(EvaluationResult.run_id == run_id)
        )
        return result.scalars().all()
