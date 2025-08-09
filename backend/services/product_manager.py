import os
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio

from models.schemas import ProductData, ProductInfo

logger = logging.getLogger(__name__)

class ProductManager:
    def __init__(self):
        self.products: Dict[str, Dict[str, Any]] = {}
        self.data_dir = "data/processed"
        os.makedirs(self.data_dir, exist_ok=True)

    async def load_all_products(self):
        """Load all existing products from storage"""
        try:
            if not os.path.exists(self.data_dir):
                logger.info("No existing products found")
                return

            for product_dir in os.listdir(self.data_dir):
                product_path = os.path.join(self.data_dir, product_dir)

                if os.path.isdir(product_path):
                    try:
                        await self._load_product(product_dir)
                    except Exception as e:
                        logger.error(f"Error loading product {product_dir}: {e}")

            logger.info(f"Loaded {len(self.products)} products")

        except Exception as e:
            logger.error(f"Error loading products: {e}")

    async def _load_product(self, product_id: str):
        """Load a single product from storage"""
        try:
            product_path = os.path.join(self.data_dir, product_id)

            # Load metadata
            metadata_path = os.path.join(product_path, "processed_data.json")
            if not os.path.exists(metadata_path):
                return

            with open(metadata_path, 'r') as f:
                metadata = json.load(f)

            # Load documents if they exist
            documents_path = os.path.join(product_path, "documents.json")
            documents = []

            if os.path.exists(documents_path):
                with open(documents_path, 'r') as f:
                    documents = json.load(f)

            self.products[product_id] = {
                "id": product_id,
                "name": metadata.get("product_name", product_id),
                "category": "electrical_protection",  # Default category
                "total_pages": metadata.get("total_pages", 0),
                "documents": documents,
                "embeddings": metadata.get("embeddings", {}),
                "last_updated": datetime.fromisoformat(metadata.get("processed_at", datetime.now().isoformat())),
                "metadata": metadata
            }

            logger.info(f"Loaded product {product_id}")

        except Exception as e:
            logger.error(f"Error loading product {product_id}: {e}")

    async def add_product(self, product_id: str, product_name: str, processed_data: Dict[str, Any]):
        """Add a new product or update existing one"""
        try:
            # Store in memory
            self.products[product_id] = {
                "id": product_id,
                "name": product_name,
                "category": "electrical_protection",
                "total_pages": processed_data.get("total_pages", 0),
                "documents": processed_data.get("documents", []),
                "embeddings": processed_data.get("embeddings", {}),
                "last_updated": datetime.now(),
                "metadata": processed_data
            }

            # Save to storage
            await self._save_product(product_id, processed_data)

            logger.info(f"Added/updated product {product_id}")

        except Exception as e:
            logger.error(f"Error adding product {product_id}: {e}")
            raise

    async def _save_product(self, product_id: str, data: Dict[str, Any]):
        """Save product data to storage"""
        try:
            product_path = os.path.join(self.data_dir, product_id)
            os.makedirs(product_path, exist_ok=True)

            # Save documents separately (they can be large)
            documents = data.get("documents", [])
            documents_path = os.path.join(product_path, "documents.json")

            with open(documents_path, 'w') as f:
                json.dump(documents, f)

            # Save metadata without documents
            metadata = {k: v for k, v in data.items() if k != "documents"}
            metadata_path = os.path.join(product_path, "processed_data.json")

            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2, default=str)

            logger.info(f"Saved product {product_id} to storage")

        except Exception as e:
            logger.error(f"Error saving product {product_id}: {e}")

    async def get_product(self, product_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific product"""
        return self.products.get(product_id)

    async def get_all_products(self) -> List[ProductInfo]:
        """Get list of all products"""
        try:
            products = []

            for product_id, product_data in self.products.items():
                product_info = ProductInfo(
                    id=product_id,
                    name=product_data["name"],
                    category=product_data["category"],
                    total_pages=product_data["total_pages"],
                    last_updated=product_data["last_updated"],
                    embeddings_count=product_data["embeddings"].get("total_count", 0)
                )
                products.append(product_info)

            return products

        except Exception as e:
            logger.error(f"Error getting all products: {e}")
            return []

    async def delete_product(self, product_id: str) -> bool:
        """Delete a product"""
        try:
            if product_id in self.products:
                # Remove from memory
                del self.products[product_id]

                # Remove from storage
                product_path = os.path.join(self.data_dir, product_id)
                if os.path.exists(product_path):
                    import shutil
                    shutil.rmtree(product_path)

                logger.info(f"Deleted product {product_id}")
                return True

            return False

        except Exception as e:
            logger.error(f"Error deleting product {product_id}: {e}")
            return False

    async def search_products(self, query: str) -> List[ProductInfo]:
        """Search products by name or content"""
        try:
            matching_products = []
            query_lower = query.lower()

            for product_id, product_data in self.products.items():
                # Search in product name
                if query_lower in product_data["name"].lower():
                    product_info = ProductInfo(
                        id=product_id,
                        name=product_data["name"],
                        category=product_data["category"],
                        total_pages=product_data["total_pages"],
                        last_updated=product_data["last_updated"],
                        embeddings_count=product_data["embeddings"].get("total_count", 0)
                    )
                    matching_products.append(product_info)
                    continue

                # Search in document content
                documents = product_data.get("documents", [])
                for doc in documents:
                    if query_lower in doc.get("content", "").lower():
                        product_info = ProductInfo(
                            id=product_id,
                            name=product_data["name"],
                            category=product_data["category"],
                            total_pages=product_data["total_pages"],
                            last_updated=product_data["last_updated"],
                            embeddings_count=product_data["embeddings"].get("total_count", 0)
                        )
                        matching_products.append(product_info)
                        break

            return matching_products

        except Exception as e:
            logger.error(f"Error searching products: {e}")
            return []

    async def get_product_statistics(self) -> Dict[str, Any]:
        """Get statistics about all products"""
        try:
            total_products = len(self.products)
            total_documents = sum(
                len(product["documents"])
                for product in self.products.values()
            )
            total_pages = sum(
                product["total_pages"]
                for product in self.products.values()
            )

            # Count by category
            categories = {}
            for product in self.products.values():
                category = product["category"]
                categories[category] = categories.get(category, 0) + 1

            # Recent activity
            recent_updates = []
            for product_id, product in self.products.items():
                recent_updates.append({
                    "product_id": product_id,
                    "name": product["name"],
                    "last_updated": product["last_updated"]
                })

            recent_updates.sort(key=lambda x: x["last_updated"], reverse=True)

            return {
                "total_products": total_products,
                "total_documents": total_documents,
                "total_pages": total_pages,
                "categories": categories,
                "recent_updates": recent_updates[:5]
            }

        except Exception as e:
            logger.error(f"Error getting product statistics: {e}")
            return {}

    async def get_product_by_category(self, category: str) -> List[ProductInfo]:
        """Get products by category"""
        try:
            products = []

            for product_id, product_data in self.products.items():
                if product_data["category"] == category:
                    product_info = ProductInfo(
                        id=product_id,
                        name=product_data["name"],
                        category=product_data["category"],
                        total_pages=product_data["total_pages"],
                        last_updated=product_data["last_updated"],
                        embeddings_count=product_data["embeddings"].get("total_count", 0)
                    )
                    products.append(product_info)

            return products

        except Exception as e:
            logger.error(f"Error getting products by category {category}: {e}")
            return []

    async def update_product_metadata(self, product_id: str, metadata: Dict[str, Any]) -> bool:
        """Update product metadata"""
        try:
            if product_id not in self.products:
                return False

            # Update in memory
            self.products[product_id]["metadata"].update(metadata)
            self.products[product_id]["last_updated"] = datetime.now()

            # Save to storage
            await self._save_product(product_id, self.products[product_id])

            logger.info(f"Updated metadata for product {product_id}")
            return True

        except Exception as e:
            logger.error(f"Error updating metadata for product {product_id}: {e}")
            return False

    def get_product_count(self) -> int:
        """Get total number of products"""
        return len(self.products)

    def is_product_exists(self, product_id: str) -> bool:
        """Check if product exists"""
        return product_id in self.products
