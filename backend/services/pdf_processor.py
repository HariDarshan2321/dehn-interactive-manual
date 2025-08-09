import os
import json
import logging
from typing import Dict, List, Any
from datetime import datetime
import asyncio

import PyPDF2
from pdf2image import convert_from_path
from PIL import Image
import base64
import io
import numpy as np

from services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

class PDFProcessor:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.chunk_size = 500
        self.chunk_overlap = 50

    async def process_pdf(self, pdf_path: str, product_id: str, product_name: str) -> Dict[str, Any]:
        """Process a PDF file and extract text and images with embeddings"""
        logger.info(f"Processing PDF: {pdf_path} for product {product_id}")

        try:
            # Extract text content
            text_documents = await self._extract_text_content(pdf_path, product_id)

            # Extract images
            image_documents = await self._extract_images(pdf_path, product_id)

            # Generate embeddings for all documents
            all_documents = text_documents + image_documents

            # Generate embeddings in batches
            for doc in all_documents:
                if doc["type"] == "text":
                    doc["embedding"] = await self.embedding_service.generate_text_embedding(doc["content"])
                elif doc["type"] == "image":
                    doc["embedding"] = await self.embedding_service.generate_image_embedding(doc["image_data"])

            result = {
                "product_id": product_id,
                "product_name": product_name,
                "total_pages": len(set(doc["page_number"] for doc in all_documents)),
                "documents": all_documents,
                "embeddings": {
                    "text_count": len(text_documents),
                    "image_count": len(image_documents),
                    "total_count": len(all_documents)
                },
                "processed_at": datetime.now().isoformat()
            }

            # Save processed data
            await self._save_processed_data(result, product_id)

            logger.info(f"Successfully processed PDF for {product_id}: {len(all_documents)} documents")
            return result

        except Exception as e:
            logger.error(f"Error processing PDF {pdf_path}: {e}")
            raise

    async def _extract_text_content(self, pdf_path: str, product_id: str) -> List[Dict[str, Any]]:
        """Extract text content from PDF"""
        documents = []

        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)

                for page_num, page in enumerate(pdf_reader.pages, 1):
                    try:
                        text = page.extract_text()

                        if text.strip():
                            # Split text into chunks
                            chunks = self._split_text_into_chunks(text)

                            for chunk_idx, chunk in enumerate(chunks):
                                doc = {
                                    "id": f"{product_id}_page_{page_num}_text_{chunk_idx}",
                                    "content": chunk,
                                    "type": "text",
                                    "page_number": page_num,
                                    "metadata": {
                                        "section": self._detect_section(chunk),
                                        "safety_level": self._detect_safety_level(chunk),
                                        "component_type": self._detect_component_type(chunk)
                                    }
                                }
                                documents.append(doc)

                    except Exception as e:
                        logger.warning(f"Error extracting text from page {page_num}: {e}")
                        continue

        except Exception as e:
            logger.error(f"Error reading PDF file: {e}")
            raise

        return documents

    async def _extract_images(self, pdf_path: str, product_id: str) -> List[Dict[str, Any]]:
        """Extract images from PDF"""
        documents = []

        try:
            # Convert PDF pages to images
            images = convert_from_path(pdf_path, dpi=200)

            for page_num, image in enumerate(images, 1):
                try:
                    # Convert PIL image to base64
                    buffer = io.BytesIO()
                    image.save(buffer, format='PNG')
                    image_base64 = base64.b64encode(buffer.getvalue()).decode()

                    # Check if image contains meaningful content
                    if await self._is_meaningful_image(image):
                        doc = {
                            "id": f"{product_id}_page_{page_num}_image",
                            "content": f"[Image: Page {page_num} - Technical diagram]",
                            "type": "image",
                            "page_number": page_num,
                            "image_data": image_base64,
                            "metadata": {
                                "width": image.width,
                                "height": image.height,
                                "format": "PNG",
                                "has_diagrams": True
                            }
                        }
                        documents.append(doc)

                except Exception as e:
                    logger.warning(f"Error processing image from page {page_num}: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error extracting images from PDF: {e}")
            # Continue without images if extraction fails

        return documents

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
            'surge_protector': ['surge protector', 'spd', 'dehnguard'],
            'terminal_block': ['terminal', 'connection block', 'connector'],
            'wire': ['wire', 'cable', 'conductor'],
            'ground': ['ground', 'earth', 'pe'],
            'mounting': ['mounting', 'bracket', 'rail']
        }

        for component, keywords in component_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                components.append(component)

        return ', '.join(components) if components else 'general'

    async def _is_meaningful_image(self, image: Image.Image) -> bool:
        """Check if image contains meaningful content (not just blank pages)"""
        try:
            # Convert to numpy array
            img_array = np.array(image.convert('L'))  # Convert to grayscale

            # Calculate variance (measure of content)
            variance = np.var(img_array)

            # If variance is too low, it's likely a blank page
            return variance > 100  # Threshold for meaningful content

        except Exception:
            return True  # If we can't analyze, assume it's meaningful

    async def _save_processed_data(self, data: Dict[str, Any], product_id: str):
        """Save processed data to file"""
        try:
            output_dir = f"data/processed/{product_id}"
            os.makedirs(output_dir, exist_ok=True)

            output_path = f"{output_dir}/processed_data.json"

            # Create a serializable version (without binary data)
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

            logger.info(f"Saved processed data to {output_path}")

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
