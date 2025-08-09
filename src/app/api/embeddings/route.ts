import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Generate embedding using OpenAI
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return NextResponse.json({
      success: true,
      embedding: response.data[0].embedding,
      model: "text-embedding-3-small",
      usage: response.usage
    });

  } catch (error) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}
