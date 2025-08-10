import { NextRequest, NextResponse } from 'next/server';
import { productEmbeddingService } from '@/lib/ai/product-embeddings';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;

    // Remove product from the embedding service
    await productEmbeddingService.removeProduct(productId);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      productId
    });

  } catch (error) {
    console.error('Admin delete product error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
