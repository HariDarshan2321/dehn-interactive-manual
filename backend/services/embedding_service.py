import os
import logging
from typing import List, Dict, Any, Optional
import asyncio

import openai
import google.generativeai as genai
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        # Initialize OpenAI client
        openai.api_key = os.getenv("OPENAI_API_KEY")

        # Initialize Gemini
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

        self.text_model = "text-embedding-3-small"
        self.batch_size = 100

    async def generate_text_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI"""
        try:
            response = await openai.embeddings.acreate(
                model=self.text_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating text embedding: {e}")
            return []

    async def generate_image_embedding(self, image_base64: str) -> List[float]:
        """Generate embedding for image using Gemini Vision"""
        try:
            # Use Gemini to describe the image, then embed the description
            model = genai.GenerativeModel('gemini-1.5-pro-latest')

            response = await model.generate_content_async([
                {
                    "text": "Describe this technical diagram/image in detail, focusing on electrical components, connections, and installation steps. Be specific about component types, wire colors, terminal markings, and safety elements."
                },
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": image_base64
                    }
                }
            ])

            description = response.text

            # Generate embedding for the description
            return await self.generate_text_embedding(description)

        except Exception as e:
            logger.error(f"Error generating image embedding: {e}")
            return []

    async def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts in batch"""
        embeddings = []

        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]

            try:
                response = await openai.embeddings.acreate(
                    model=self.text_model,
                    input=batch
                )

                batch_embeddings = [data.embedding for data in response.data]
                embeddings.extend(batch_embeddings)

            except Exception as e:
                logger.error(f"Error generating batch embeddings: {e}")
                # Add empty embeddings for failed batch
                embeddings.extend([[] for _ in batch])

        return embeddings

    async def search_similar(self, query: str, documents: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents using cosine similarity"""
        try:
            # Generate query embedding
            query_embedding = await self.generate_text_embedding(query)

            if not query_embedding:
                return []

            # Calculate similarities
            similarities = []

            for doc in documents:
                if "embedding" in doc and doc["embedding"]:
                    similarity = self._cosine_similarity(query_embedding, doc["embedding"])
                    similarities.append({
                        "document": doc,
                        "similarity": similarity
                    })

            # Sort by similarity and return top k
            similarities.sort(key=lambda x: x["similarity"], reverse=True)

            return [item["document"] for item in similarities[:top_k]]

        except Exception as e:
            logger.error(f"Error searching similar documents: {e}")
            return []

    async def search_multimodal(self, query: str, image_base64: Optional[str], documents: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
        """Search using both text and image queries"""
        try:
            results = []

            # Text-based search
            if query:
                text_results = await self.search_similar(query, documents, top_k)
                results.extend(text_results)

            # Image-based search
            if image_base64:
                image_embedding = await self.generate_image_embedding(image_base64)

                if image_embedding:
                    image_similarities = []

                    for doc in documents:
                        if "embedding" in doc and doc["embedding"]:
                            similarity = self._cosine_similarity(image_embedding, doc["embedding"])
                            image_similarities.append({
                                "document": doc,
                                "similarity": similarity
                            })

                    image_similarities.sort(key=lambda x: x["similarity"], reverse=True)
                    image_results = [item["document"] for item in image_similarities[:top_k]]
                    results.extend(image_results)

            # Remove duplicates and return top k
            unique_results = []
            seen_ids = set()

            for doc in results:
                if doc["id"] not in seen_ids:
                    unique_results.append(doc)
                    seen_ids.add(doc["id"])

                if len(unique_results) >= top_k:
                    break

            return unique_results

        except Exception as e:
            logger.error(f"Error in multimodal search: {e}")
            return []

    async def find_relevant_sections(self, query: str, documents: List[Dict[str, Any]], section_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Find relevant sections based on query and optional section filter"""
        try:
            # Filter by section type if specified
            filtered_docs = documents
            if section_type:
                filtered_docs = [
                    doc for doc in documents
                    if doc.get("metadata", {}).get("section") == section_type
                ]

            # Search within filtered documents
            return await self.search_similar(query, filtered_docs, top_k=10)

        except Exception as e:
            logger.error(f"Error finding relevant sections: {e}")
            return []

    async def get_safety_related_content(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get all safety-related content from documents"""
        try:
            safety_docs = []

            for doc in documents:
                metadata = doc.get("metadata", {})
                content = doc.get("content", "").lower()

                # Check if document is safety-related
                if (metadata.get("section") == "safety" or
                    metadata.get("safety_level") in ["critical", "warning"] or
                    any(keyword in content for keyword in ["safety", "warning", "caution", "danger"])):
                    safety_docs.append(doc)

            # Sort by safety level priority
            def safety_priority(doc):
                level = doc.get("metadata", {}).get("safety_level", "info")
                priority_map = {"critical": 3, "warning": 2, "info": 1}
                return priority_map.get(level, 0)

            safety_docs.sort(key=safety_priority, reverse=True)
            return safety_docs

        except Exception as e:
            logger.error(f"Error getting safety content: {e}")
            return []

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            if not vec1 or not vec2 or len(vec1) != len(vec2):
                return 0.0

            # Convert to numpy arrays
            a = np.array(vec1).reshape(1, -1)
            b = np.array(vec2).reshape(1, -1)

            # Calculate cosine similarity
            similarity = cosine_similarity(a, b)[0][0]
            return float(similarity)

        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {e}")
            return 0.0

    async def cluster_documents(self, documents: List[Dict[str, Any]], n_clusters: int = 5) -> Dict[str, List[Dict[str, Any]]]:
        """Cluster documents based on their embeddings"""
        try:
            from sklearn.cluster import KMeans

            # Extract embeddings
            embeddings = []
            valid_docs = []

            for doc in documents:
                if "embedding" in doc and doc["embedding"]:
                    embeddings.append(doc["embedding"])
                    valid_docs.append(doc)

            if len(embeddings) < n_clusters:
                return {"cluster_0": valid_docs}

            # Perform clustering
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            cluster_labels = kmeans.fit_predict(embeddings)

            # Group documents by cluster
            clusters = {}
            for i, label in enumerate(cluster_labels):
                cluster_key = f"cluster_{label}"
                if cluster_key not in clusters:
                    clusters[cluster_key] = []
                clusters[cluster_key].append(valid_docs[i])

            return clusters

        except Exception as e:
            logger.error(f"Error clustering documents: {e}")
            return {"cluster_0": documents}

    async def get_document_summary(self, documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get summary statistics about document embeddings"""
        try:
            total_docs = len(documents)
            text_docs = len([doc for doc in documents if doc.get("type") == "text"])
            image_docs = len([doc for doc in documents if doc.get("type") == "image"])

            # Count by section
            sections = {}
            for doc in documents:
                section = doc.get("metadata", {}).get("section", "unknown")
                sections[section] = sections.get(section, 0) + 1

            # Count by safety level
            safety_levels = {}
            for doc in documents:
                level = doc.get("metadata", {}).get("safety_level", "info")
                safety_levels[level] = safety_levels.get(level, 0) + 1

            return {
                "total_documents": total_docs,
                "text_documents": text_docs,
                "image_documents": image_docs,
                "sections": sections,
                "safety_levels": safety_levels,
                "has_embeddings": len([doc for doc in documents if doc.get("embedding")])
            }

        except Exception as e:
            logger.error(f"Error getting document summary: {e}")
            return {}
