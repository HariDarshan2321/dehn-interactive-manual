import { NextRequest, NextResponse } from 'next/server';
import { productEmbeddingService } from '@/lib/ai/product-embeddings';

export async function POST(request: NextRequest) {
  try {
    const product = await request.json();

    // Add product to the embedding service
    await productEmbeddingService.addProduct(product);

    return NextResponse.json({
      success: true,
      message: 'Product added successfully',
      productId: product.id
    });

  } catch (error) {
    console.error('Admin add product error:', error);
    return NextResponse.json(
      { error: 'Failed to add product' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const products = productEmbeddingService.getAvailableProducts();

    return NextResponse.json({
      success: true,
      data: {
        products: products.map(p => ({
          ...p,
          category: p.id.includes('surge') ? 'Surge Protection' :
                   p.id.includes('lightning') ? 'Lightning Protection' :
                   p.id.includes('earth') ? 'Earthing' :
                   p.id.includes('arc') ? 'Arc Fault Protection' : 'Safety Equipment',
          description: `Professional ${p.name} for electrical installations`,
          qrCode: `DEHN-${p.id.toUpperCase()}-2024`,
          manualUrl: `/pdfs/${p.id}.pdf`,
          videoUrl: `/videos/${p.id}-installation.mp4`,
          imageUrl: `/images/products/${p.id}.jpg`,
          estimatedInstallTime: '15-25 minutes',
          difficultyLevel: 'Medium',
          requiredTools: ['Phillips screwdriver', 'Wire strippers', 'Multimeter'],
          safetyWarnings: [
            'Ensure power is disconnected before installation',
            'Use appropriate PPE',
            'Verify correct wire connections'
          ]
        }))
      }
    });

  } catch (error) {
    console.error('Admin get products error:', error);
    return NextResponse.json(
      { error: 'Failed to get products' },
      { status: 500 }
    );
  }
}
