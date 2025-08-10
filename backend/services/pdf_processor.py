"""
PDF Processing Service for DEHN Interactive Manual
Extracts text and images from PDF files using multimodal CLIP embeddings
Based on the reference implementation for unified text/image processing
"""

import os
import json
import logging
from typing import Dict, List, Any
from datetime import datetime
import asyncio
import base64
import io

# PDF processing
import fitz  # PyMuPDF
from PIL import Image
import numpy as np

# CLIP for multimodal embeddings
from transformers import CLIPProcessor, CLIPModel
import torch

logger = logging.getLogger(__name__)

class PDFProcessor:
    def __init__(self):
        # Initialize CLIP model for unified embeddings
        self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.clip_model.eval()

        self.chunk_size = 500
        self.chunk_overlap = 100

    def embed_image(self, image_data):
        """Embed image using CLIP"""
        if isinstance(image_data, str):  # If base64 string
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        elif isinstance(image_data, Image.Image):  # If PIL Image
            image = image_data
        else:
            raise ValueError("Unsupported image data type")

        inputs = self.clip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            features = self.clip_model.get_image_features(**inputs)
            # Normalize embeddings to unit vector
            features = features / features.norm(dim=-1, keepdim=True)
            return features.squeeze().numpy()

    def embed_text(self, text):
        """Embed text using CLIP"""
        inputs = self.clip_processor(
            text=text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=77  # CLIP's max token length
        )
        with torch.no_grad():
            features = self.clip_model.get_text_features(**inputs)
            # Normalize embeddings
            features = features / features.norm(dim=-1, keepdim=True)
            return features.squeeze().numpy()

    async def process_pdf(self, pdf_path: str, product_id: str, product_name: str) -> Dict[str, Any]:
        """Process a PDF file and extract text and images with CLIP embeddings"""
        logger.info(f"Processing PDF: {pdf_path} for product {product_id}")

        try:
            # Open PDF with PyMuPDF
            doc = fitz.open(pdf_path)

            # Storage for all documents and embeddings
            all_docs = []
            all_embeddings = []
            image_data_store = {}  # Store actual image data for LLM

            # Process each page
            for page_num in range(len(doc)):
                page = doc[page_num]
                # Process text
                text = page.get_text()
                if text.strip():
                    # Split text into chunks
                    text_chunks = self._split_text_into_chunks(text)

                    for chunk_idx, chunk in enumerate(text_chunks):
                        # Create document
                        doc_id = f"{product_id}_page_{page_num}_text_{chunk_idx}"
                        text_doc = {
                            "id": doc_id,
                            "content": chunk,
                            "type": "text",
                            "page_number": page_num,
                            "metadata": {
                                "product_id": product_id,
                                "product_name": product_name,
                                "section": self._detect_section(chunk),
                                "safety_level": self._detect_safety_level(chunk),
                                "component_type": self._detect_component_type(chunk)
                            }
                        }

                        # Generate CLIP embedding
                        embedding = self.embed_text(chunk)
                        text_doc["embedding"] = embedding.tolist()

                        all_docs.append(text_doc)
                        all_embeddings.append(embedding)

                # Process images
                for img_index, img in enumerate(page.get_images(full=True)):
                    try:
                        xref = img[0]
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]

                        # Convert to PIL Image
                        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

                        # Create unique identifier
                        image_id = f"{product_id}_page_{page_num}_img_{img_index}"

                        # Store image as base64 for later use with GPT-4V
                        buffered = io.BytesIO()
                        pil_image.save(buffered, format="PNG")
                        img_base64 = base64.b64encode(buffered.getvalue()).decode()
                        image_data_store[image_id] = img_base64

                        # Create document for image
                        image_doc = {
                            "id": image_id,
                            "content": f"[Image: {image_id} - Technical diagram from page {page_num}]",
                            "type": "image",
                            "page_number": page_num,
                            "image_data": img_base64,
                            "metadata": {
                                "product_id": product_id,
                                "product_name": product_name,
                                "image_id": image_id,
                                "width": pil_image.width,
                                "height": pil_image.height,
                                "format": "PNG"
                            }
                        }

                        # Generate CLIP embedding for image
                        embedding = self.embed_image(pil_image)
                        image_doc["embedding"] = embedding.tolist()

                        all_docs.append(image_doc)
                        all_embeddings.append(embedding)

                    except Exception as e:
                        logger.warning(f"Error processing image {img_index} on page {page_num}: {e}")
                        continue

            total_pages = len(doc)
            doc.close()

            result = {
                "product_id": product_id,
                "product_name": product_name,
                "total_pages": total_pages,
                "documents": all_docs,
                "embeddings": {
                    "text_count": len([d for d in all_docs if d["type"] == "text"]),
                    "image_count": len([d for d in all_docs if d["type"] == "image"]),
                    "total_count": len(all_docs)
                },
                "image_data_store": image_data_store,
                "processed_at": datetime.now().isoformat()
            }

            # Save processed data
            await self._save_processed_data(result, product_id)

            logger.info(f"Successfully processed PDF for {product_id}: {len(all_docs)} documents")
            return result

        except Exception as e:
            logger.error(f"Error processing PDF {pdf_path}: {e}")
            raise

    def _split_text_into_chunks(self, text: str) -> List[str]:
        """Split text into overlapping chunks"""
        words = text.split()
        chunks = []

        for i in range(0, len(words), self.chunk_size - self.chunk_overlap):
            chunk = ' '.join(words[i:i + self.chunk_size])
            if chunk.strip():
                chunks.append(chunk)

        return chunks

    def _detect_section(self, text: str) -> str:
        """Detect the section type of the text"""
        text_lower = text.lower()

        if any(keyword in text_lower for keyword in ['safety', 'warning', 'caution', 'danger']):
            return 'safety'
        elif any(keyword in text_lower for keyword in ['installation', 'mounting', 'assembly']):
            return 'installation'
        elif any(keyword in text_lower for keyword in ['wiring', 'connection', 'terminal']):
            return 'wiring'
        elif any(keyword in text_lower for keyword in ['troubleshooting', 'problem', 'fault']):
            return 'troubleshooting'
        elif any(keyword in text_lower for keyword in ['specification', 'technical', 'parameter']):
            return 'specifications'
        else:
            return 'general'

    def _detect_safety_level(self, text: str) -> str:
        """Detect safety level of the text"""
        text_lower = text.lower()

        if any(keyword in text_lower for keyword in ['danger', 'fatal', 'death', 'electrocution']):
            return 'critical'
        elif any(keyword in text_lower for keyword in ['warning', 'caution', 'risk']):
            return 'warning'
        else:
            return 'info'

    def _detect_component_type(self, text: str) -> str:
        """Detect component types mentioned in the text"""
        text_lower = text.lower()
        components = []

        component_keywords = {
            'surge_protector': ['surge protector', 'spd', 'dehnguard', 'dehnventil'],
            'terminal_block': ['terminal', 'connection block', 'connector'],
            'wire': ['wire', 'cable', 'conductor'],
            'ground': ['ground', 'earth', 'pe'],
            'mounting': ['mounting', 'bracket', 'rail']
        }

        for component, keywords in component_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                components.append(component)

        return ', '.join(components) if components else 'general'

    async def _save_processed_data(self, data: Dict[str, Any], product_id: str):
        """Save processed data to file"""
        try:
            output_dir = f"data/processed/{product_id}"
            os.makedirs(output_dir, exist_ok=True)

            # Save main processed data (without embeddings for size)
            output_path = f"{output_dir}/processed_data.json"
            serializable_data = {
                "product_id": data["product_id"],
                "product_name": data["product_name"],
                "total_pages": data["total_pages"],
                "embeddings": data["embeddings"],
                "processed_at": data["processed_at"],
                "document_count": len(data["documents"])
            }

            with open(output_path, 'w') as f:
                json.dump(serializable_data, f, indent=2)

            # Save documents with embeddings separately
            docs_path = f"{output_dir}/documents.json"
            with open(docs_path, 'w') as f:
                json.dump(data["documents"], f, indent=2)

            # Save image data store
            images_path = f"{output_dir}/images.json"
            with open(images_path, 'w') as f:
                json.dump(data["image_data_store"], f, indent=2)

            logger.info(f"Saved processed data to {output_dir}")

        except Exception as e:
            logger.error(f"Error saving processed data: {e}")

    async def batch_process_pdfs(self, pdf_list: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Process multiple PDFs in batch"""
        results = []

        for pdf_info in pdf_list:
            try:
                result = await self.process_pdf(
                    pdf_info["pdf_path"],
                    pdf_info["product_id"],
                    pdf_info["product_name"]
                )
                results.append({
                    "product_id": pdf_info["product_id"],
                    "status": "success",
                    "result": result
                })
            except Exception as e:
                logger.error(f"Error processing {pdf_info['product_id']}: {e}")
                results.append({
                    "product_id": pdf_info["product_id"],
                    "status": "error",
                    "error": str(e)
                })

        return results

    def retrieve_multimodal(self, query: str, documents: List[Dict], k: int = 5) -> List[Dict]:
        """Unified retrieval using CLIP embeddings for both text and images"""
        # Embed query using CLIP
        query_embedding = self.embed_text(query)

        # Calculate similarities
        similarities = []
        for doc in documents:
            if "embedding" in doc:
                doc_embedding = np.array(doc["embedding"])
                similarity = np.dot(query_embedding, doc_embedding)
                similarities.append((similarity, doc))

        # Sort by similarity and return top k
        similarities.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in similarities[:k]]

    async def update_product_pdf(self, product_id: str, new_pdf_path: str) -> Dict[str, Any]:
        """Update an existing product with a new PDF"""
        logger.info(f"Updating product {product_id} with new PDF: {new_pdf_path}")

        try:
            # Get existing product data
            existing_data_path = f"data/processed/{product_id}/processed_data.json"
            product_name = product_id  # Default fallback

            if os.path.exists(existing_data_path):
                with open(existing_data_path, 'r') as f:
                    existing_data = json.load(f)
                    product_name = existing_data.get("product_name", product_id)

            # Process new PDF
            result = await self.process_pdf(new_pdf_path, product_id, product_name)

            logger.info(f"Successfully updated product {product_id}")
            return result

        except Exception as e:
            logger.error(f"Error updating product {product_id}: {e}")
            raise
