import { NextRequest, NextResponse } from 'next/server';
import { productEmbeddingService } from '@/lib/ai/product-embeddings';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query, productId, language = 'en', sectionFilter } = await request.json();

    if (!query || !productId) {
      return NextResponse.json(
        { error: 'Query and productId are required' },
        { status: 400 }
      );
    }

    // Load product-specific embeddings
    console.log(`🔍 Searching in product: ${productId} for query: "${query}"`);

    try {
      // Search only in this product's embeddings - no hallucination
      const searchResult = await productEmbeddingService.searchInProduct(
        productId,
        query,
        sectionFilter
      );

      if (searchResult.results.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            answer: "I couldn't find information about that in this product's manual. Please check if you're asking about the correct product or try rephrasing your question.",
            sources: [],
            confidence: 0,
            exactMatch: false,
            productId,
            query,
            language,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Use GPT-4 to format the exact manual content (no hallucination)
      const manualContent = searchResult.results
        .map(doc => `[Page ${doc.pageNumber}]: ${doc.content}`)
        .join('\n\n');

      const systemPrompt = `You are a DEHN technical documentation assistant.

CRITICAL RULES:
1. ONLY use the exact content provided from the manual
2. NEVER add information not in the manual
3. NEVER paraphrase safety warnings - quote them exactly
4. Always reference page numbers
5. If asked about something not in the provided content, say so clearly

Manual content for ${productId}:
${manualContent}

User question: ${query}

Provide a helpful answer using ONLY the manual content above. Include page references.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        temperature: 0.1, // Very low temperature for accuracy
        max_tokens: 500
      });

      const answer = response.choices[0].message.content || "Unable to process the manual content.";

      // Extract safety warnings from exact matches
      const safetyWarnings = searchResult.exactMatches
        .filter(doc => doc.metadata.safetyLevel === 'critical' || doc.metadata.safetyLevel === 'warning')
        .map(doc => doc.content);

      // Get related images
      const relatedImages = searchResult.results
        .filter(doc => doc.type === 'image')
        .map(doc => ({
          pageNumber: doc.pageNumber,
          description: doc.content,
          imageData: doc.imageData
        }));

      return NextResponse.json({
        success: true,
        data: {
          answer,
          sources: searchResult.results.map(doc => `Page ${doc.pageNumber}`),
          confidence: searchResult.confidence,
          exactMatch: searchResult.exactMatches.length > 0,
          safetyWarnings,
          relatedImages,
          productId,
          query,
          language,
          sectionsFound: searchResult.results.map(doc => doc.metadata.section).filter(Boolean),
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Product embedding search error:', error);
      return NextResponse.json(
        { error: 'Product manual not available or failed to load' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Product-specific search error:', error);
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
