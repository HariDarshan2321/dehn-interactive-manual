#!/usr/bin/env python3
"""
Process DEHNventil M2 PDF and create embeddings
"""

import os
import sys
import asyncio
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(backend_dir / ".env")

from services.pdf_processor import PDFProcessor
from services.embedding_service import EmbeddingService
from services.product_manager import ProductManager

async def process_dehnventil_m2():
    """Process the DEHNventil M2 PDF and create embeddings"""

    print("🔧 Processing DEHNventil M2 PDF...")
    print("=" * 50)

    # Initialize services
    pdf_processor = PDFProcessor()
    embedding_service = EmbeddingService()
    product_manager = ProductManager()

    # Load existing products
    await product_manager.load_all_products()

    # Check if PDF exists
    pdf_path = backend_dir.parent / "public" / "pdfs" / "dehnventil-m2.pdf"
    if not pdf_path.exists():
        print(f"❌ PDF not found at {pdf_path}")
        return False

    print(f"✓ Found PDF at {pdf_path}")

    # Product details
    product_id = "dehnventil-m2"
    product_name = "DEHNventil M2 TNC 255 FM"

    # Check if product already exists
    existing_product = await product_manager.get_product(product_id)
    if existing_product:
        print(f"✓ Product {product_id} already exists with {len(existing_product.get('documents', []))} documents")
        return True

    print(f"📄 Processing PDF for product: {product_name}")

    try:
        # Process the PDF
        processed_data = await pdf_processor.process_pdf(
            pdf_path=str(pdf_path),
            product_id=product_id,
            product_name=product_name
        )

        print(f"✓ PDF processed successfully:")
        print(f"  - Total pages: {processed_data.get('total_pages', 0)}")
        print(f"  - Documents extracted: {len(processed_data.get('documents', []))}")

        # Embeddings are already generated in the PDF processor
        print("✓ Embeddings already generated during PDF processing")

        # Store in product manager
        await product_manager.add_product(
            product_id=product_id,
            product_name=product_name,
            processed_data=processed_data
        )

        print(f"✅ Successfully processed and stored product: {product_name}")
        return True

    except Exception as e:
        print(f"❌ Error processing PDF: {e}")
        return False

async def main():
    """Main function"""
    success = await process_dehnventil_m2()

    if success:
        print("\n🎉 DEHNventil M2 processing complete!")
        print("📍 Backend server: http://localhost:8000")
        print("📖 API docs: http://localhost:8000/docs")
        print("🔍 QR Code: DEHN-DEHNVENTIL-M2-2024")
        print("📱 Test QR: http://localhost:3000/demo-qr-dehnventil-m2.html")
    else:
        print("\n❌ Processing failed!")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
