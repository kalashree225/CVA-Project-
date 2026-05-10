import uuid
import random
import logging
<<<<<<< HEAD
=======
import numpy as np
>>>>>>> 1f9e1f428c60a05a90a56f90b558cb17b6e52531
from pinecone import Pinecone, ServerlessSpec
from app.config import settings
from typing import Optional, List

logger = logging.getLogger(__name__)


class VectorService:
    """Service for Pinecone vector similarity search."""
    
    @staticmethod
    def get_pinecone_client() -> Pinecone:
        """Get Pinecone client."""
        return Pinecone(api_key=settings.PINECONE_API_KEY)
    
    @staticmethod
    async def ensure_index_exists():
        """Create Pinecone index if it doesn't exist."""
        try:
            pc = VectorService.get_pinecone_client()
            
            # Check if index exists
            existing_indexes = [idx.name for idx in pc.list_indexes()]
            
            if settings.PINECONE_INDEX not in existing_indexes:
                pc.create_index(
                    name=settings.PINECONE_INDEX,
                    dimension=settings.PINECONE_DIMENSION,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"
                    )
                )
                logger.info(f"Created Pinecone index: {settings.PINECONE_INDEX}")
        except Exception as e:
            logger.warning(f"Pinecone index check failed: {e}")
    
    @staticmethod
    def generate_mock_embedding(metadata: dict) -> List[float]:
        """Generate a mock normalized embedding vector."""
        # Generate random vector
        vector = [random.uniform(-1, 1) for _ in range(settings.PINECONE_DIMENSION)]
        
        # Normalize
        norm = sum(x**2 for x in vector) ** 0.5
        vector = [x / norm for x in vector]
        
        return vector
    
    @staticmethod
    async def upsert_embedding(
        run_id: uuid.UUID,
        model_name: str,
        input_type: str,
        metadata: Optional[dict] = None
    ):
        """Upsert embedding for a run into Pinecone."""
        try:
            pc = VectorService.get_pinecone_client()
            index = pc.Index(settings.PINECONE_INDEX)
            
            embedding = VectorService.generate_mock_embedding({
                "run_id": str(run_id),
                "model": model_name,
                "input_type": input_type
            })
            
            # Prepare metadata
            pinecone_metadata = {
                "run_id": str(run_id),
                "model_name": model_name,
                "input_type": input_type,
                **(metadata or {})
            }
            
            # Upsert
            index.upsert([
                {
                    "id": str(run_id),
                    "values": embedding,
                    "metadata": pinecone_metadata
                }
            ])
            
            logger.info(f"Upserted embedding for run {run_id}")
        except Exception as e:
            logger.warning(f"Pinecone upsert failed: {e}")
    
    @staticmethod
    async def query_similar(
        run_id: uuid.UUID,
        top_k: int = 5
    ) -> List[dict]:
        """Query Pinecone for similar runs."""
        try:
            pc = VectorService.get_pinecone_client()
            index = pc.Index(settings.PINECONE_INDEX)
            
            # Generate query embedding (same as upsert for mock)
            embedding = VectorService.generate_mock_embedding({"run_id": str(run_id)})
            
            # Query
            results = index.query(
                vector=embedding,
                top_k=top_k + 1,  # +1 to exclude self
                include_metadata=True
            )
            
            # Filter out the query run itself
            filtered_results = [
                {
                    "run_id": match.id,
                    "score": match.score,
                    "metadata": match.metadata
                }
                for match in results.matches
                if match.id != str(run_id)
            ]
            
            return filtered_results[:top_k]
        except Exception as e:
            logger.warning(f"Pinecone query failed: {e}")
            return []
