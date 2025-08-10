import { NextRequest, NextResponse } from 'next/server';
import { productEmbeddingService } from '@/lib/ai/product-embeddings';

// Get products from the embedding service
const getProducts = () => productEmbeddingService.getAvailableProducts().map(product => ({
  id: product.id,
  name: product.name,
  category: product.id.includes('surge') ? 'Surge Protection' :
           product.id.includes('lightning') ? 'Lightning Protection' :
           product.id.includes('earth') ? 'Earthing' :
           product.id.includes('arc') ? 'Arc Fault Protection' : 'Safety Equipment',
  description: `Professional ${product.name} for electrical installations`,
  qrCode: `DEHN-${product.id.toUpperCase()}-2024`,
  manualUrl: `/pdfs/${product.id}.pdf`,
  videoUrl: `/videos/${product.id}-installation.mp4`,
  imageUrl: `/images/products/${product.id}.jpg`,
  estimatedInstallTime: '15-25 minutes',
  difficultyLevel: 'Medium',
  isLoaded: product.isLoaded,
  requiredTools: ['Phillips screwdriver', 'Wire strippers', 'Multimeter'],
  safetyWarnings: [
    'Ensure power is disconnected before installation',
    'Use appropriate PPE',
    'Verify correct wire connections'
  ]
}));

// Legacy products for compatibility
const DEHN_PRODUCTS = [
  {
    id: 'dehnventil-m2',
    name: 'DEHNventil M2 TNC 255 FM',
    category: 'Surge Protection',
    description: 'Type 1+2 surge protective device with integrated monitoring',
    qrCode: 'DEHN-DEHNVENTIL-M2-2024',
    manualUrl: '/pdfs/dehnventil-m2.pdf',
    videoUrl: 'https://www.youtube.com/watch?v=gf25JFDuwx0',
    imageUrl: '/images/products/dehnventil-m2.jpg',
    estimatedInstallTime: '20 minutes',
    difficultyLevel: 'Medium',
    requiredTools: ['Phillips screwdriver', 'Wire strippers', 'Multimeter', 'Torque wrench'],
    safetyWarnings: [
      'Ensure power is disconnected before installation',
      'Use appropriate PPE',
      'Verify correct wire connections',
      'Check monitoring system functionality'
    ]
  },
  {
    id: 'surge_protector',
    name: 'TNC 255 Surge Protector',
    category: 'Surge Protection',
    description: 'Type 1+2 surge protective device for main distribution boards',
    qrCode: 'DEHN-TNC255-2024',
    manualUrl: '/pdfs/surge_protector.pdf',
    videoUrl: '/videos/surge_protector_installation.mp4',
    imageUrl: '/images/products/surge_protector.jpg',
    estimatedInstallTime: '15 minutes',
    difficultyLevel: 'Medium',
    requiredTools: ['Phillips screwdriver', 'Wire strippers', 'Multimeter'],
    safetyWarnings: [
      'Ensure power is disconnected before installation',
      'Use appropriate PPE',
      'Verify correct wire connections'
    ]
  },
  {
    id: 'lightning_rod',
    name: 'OPK Lightning Rod System',
    category: 'Lightning Protection',
    description: 'External lightning protection system for buildings',
    qrCode: 'DEHN-OPK-2024',
    manualUrl: '/pdfs/lightning_rod.pdf',
    videoUrl: '/videos/lightning_rod_installation.mp4',
    imageUrl: '/images/products/lightning_rod.jpg',
    estimatedInstallTime: '45 minutes',
    difficultyLevel: 'High',
    requiredTools: ['Drill', 'Mounting brackets', 'Torque wrench'],
    safetyWarnings: [
      'Work only in dry weather conditions',
      'Use fall protection equipment',
      'Follow local building codes'
    ]
  },
  {
    id: 'earthing_system',
    name: 'ERICO Earthing System',
    category: 'Earthing',
    description: 'Complete earthing solution for electrical installations',
    qrCode: 'DEHN-ERICO-2024',
    manualUrl: '/pdfs/earthing_system.pdf',
    videoUrl: '/videos/earthing_installation.mp4',
    imageUrl: '/images/products/earthing_system.jpg',
    estimatedInstallTime: '30 minutes',
    difficultyLevel: 'Medium',
    requiredTools: ['Spade', 'Earth resistance tester', 'Clamp meter'],
    safetyWarnings: [
      'Test soil conditions before installation',
      'Maintain minimum burial depth',
      'Verify earth resistance values'
    ]
  },
  {
    id: 'arc_fault_detector',
    name: 'ARC-GUARD Arc Fault Detector',
    category: 'Arc Fault Protection',
    description: 'Advanced arc fault detection and protection system',
    qrCode: 'DEHN-ARCGUARD-2024',
    manualUrl: '/pdfs/arc_fault_detector.pdf',
    videoUrl: '/videos/arc_fault_installation.mp4',
    imageUrl: '/images/products/arc_fault_detector.jpg',
    estimatedInstallTime: '20 minutes',
    difficultyLevel: 'High',
    requiredTools: ['Precision screwdriver set', 'Oscilloscope', 'Calibration tools'],
    safetyWarnings: [
      'Calibrate before first use',
      'Follow manufacturer settings',
      'Test detection sensitivity'
    ]
  },
  {
    id: 'isolator_switch',
    name: 'NSHV Isolator Switch',
    category: 'Safety Equipment',
    description: 'High-voltage isolator switch for industrial applications',
    qrCode: 'DEHN-NSHV-2024',
    manualUrl: '/pdfs/isolator_switch.pdf',
    videoUrl: '/videos/isolator_installation.mp4',
    imageUrl: '/images/products/isolator_switch.jpg',
    estimatedInstallTime: '25 minutes',
    difficultyLevel: 'High',
    requiredTools: ['Insulated tools', 'Voltage tester', 'Torque wrench'],
    safetyWarnings: [
      'Verify zero energy state',
      'Use only insulated tools',
      'Follow lockout/tagout procedures'
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    const category = searchParams.get('category');
    const qrCode = searchParams.get('qr');

    // Get specific product by ID
    if (productId) {
      const product = DEHN_PRODUCTS.find(p => p.id === productId);
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: product
      });
    }

    // Get product by QR code
    if (qrCode) {
      const product = DEHN_PRODUCTS.find(p => p.qrCode === qrCode);
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found for QR code' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: product
      });
    }

    // Filter by category
    let products = DEHN_PRODUCTS;
    if (category) {
      products = DEHN_PRODUCTS.filter(p =>
        p.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        products,
        total: products.length,
        categories: Array.from(new Set(DEHN_PRODUCTS.map(p => p.category)))
      }
    });

  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { qrCode } = await request.json();

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      );
    }

    // Find product by QR code
    const product = DEHN_PRODUCTS.find(p => p.qrCode === qrCode);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found for this QR code' },
        { status: 404 }
      );
    }

    // Log QR scan for analytics
    console.log(`QR Code scanned: ${qrCode} for product: ${product.name}`);

    return NextResponse.json({
      success: true,
      data: {
        product,
        scanTimestamp: new Date().toISOString(),
        redirectUrl: `/manual/${product.id}`
      }
    });

  } catch (error) {
    console.error('QR scan processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process QR scan' },
      { status: 500 }
    );
  }
}
