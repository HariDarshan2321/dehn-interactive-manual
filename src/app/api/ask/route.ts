import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    const { query, productId, language = 'en', sectionFilter } = await request.json();

    if (!query || !productId) {
      return NextResponse.json(
        { error: 'Query and productId are required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Forwarding query to backend: ${productId} - "${query}"`);

    // Forward request to Python backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        product_id: productId,
        language,
        section_filter: sectionFilter
      }),
    });

    if (!backendResponse.ok) {
      console.error('Backend response error:', backendResponse.status, backendResponse.statusText);
      return NextResponse.json(
        { error: 'Backend service unavailable' },
        { status: 503 }
      );
    }

    const backendData = await backendResponse.json();

    // Return the backend response directly
    return NextResponse.json(backendData);

  } catch (error) {
    console.error('Frontend API error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
