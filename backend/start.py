#!/usr/bin/env python3
"""
DEHN Interactive Manual AI Backend Startup Script
"""

import os
import sys
import asyncio
import logging
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv(backend_dir / ".env")
    print("✓ Loaded environment variables from .env file")
except ImportError:
    print("⚠️  python-dotenv not installed, loading environment variables from system")
except Exception as e:
    print(f"⚠️  Could not load .env file: {e}")

def setup_logging():
    """Setup logging configuration"""
    log_dir = backend_dir / "logs"
    log_dir.mkdir(exist_ok=True)

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_dir / "backend.log"),
            logging.StreamHandler(sys.stdout)
        ]
    )

def create_directories():
    """Create necessary directories"""
    directories = [
        "data",
        "data/pdfs",
        "data/processed",
        "data/feedback",
        "logs"
    ]

    for directory in directories:
        dir_path = backend_dir / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"✓ Created directory: {dir_path}")

def check_environment():
    """Check if required environment variables are set"""
    required_vars = [
        "OPENAI_API_KEY",
        "GEMINI_API_KEY"
    ]

    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these variables in your .env file or environment.")
        return False

    print("✓ All required environment variables are set")
    return True

def install_dependencies():
    """Install Python dependencies"""
    import subprocess

    print("📦 Installing Python dependencies...")
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r",
            str(backend_dir / "requirements.txt")
        ], check=True)
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

async def test_services():
    """Test if all services can be initialized"""
    try:
        from services.pdf_processor import PDFProcessor
        from services.video_agent import VideoAgent
        from services.product_manager import ProductManager
        from services.embedding_service import EmbeddingService

        print("🧪 Testing services...")

        # Test service initialization
        pdf_processor = PDFProcessor()
        video_agent = VideoAgent()
        product_manager = ProductManager()
        embedding_service = EmbeddingService()

        # Test product manager
        await product_manager.load_all_products()

        print("✓ All services initialized successfully")
        return True

    except Exception as e:
        print(f"❌ Service test failed: {e}")
        return False

def start_server():
    """Start the FastAPI server"""
    import uvicorn

    print("🚀 Starting DEHN Interactive Manual AI Backend...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📖 API documentation: http://localhost:8000/docs")
    print("🔄 WebSocket endpoint: ws://localhost:8000/ws/video-agent/{product_id}")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

async def main():
    """Main startup function"""
    print("🔧 DEHN Interactive Manual AI Backend Setup")
    print("=" * 50)

    # Setup logging
    setup_logging()

    # Create directories
    print("\n📁 Creating directories...")
    create_directories()

    # Check environment
    print("\n🔍 Checking environment...")
    if not check_environment():
        sys.exit(1)

    # Install dependencies
    print("\n📦 Checking dependencies...")
    if not install_dependencies():
        sys.exit(1)

    # Test services
    print("\n🧪 Testing services...")
    if not await test_services():
        sys.exit(1)

    print("\n✅ Setup complete!")
    print("=" * 50)

    # Start server
    start_server()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Shutting down gracefully...")
    except Exception as e:
        print(f"\n❌ Startup failed: {e}")
        sys.exit(1)
