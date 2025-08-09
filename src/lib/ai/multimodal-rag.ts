import OpenAI from 'openai';
import * as pdfjsLib from 'pdfjs-dist';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MultimodalDocument {
  id: string;
  content: string;
  type: 'text' | 'image';
  pageNumber: number;
  embedding?: number[];
  imageData?: string; // base64 for images
  metadata: {
    section?: string;
    componentType?: string;
    safetyLevel?: 'critical' | 'warning' | 'info';
  };
}

export interface ComponentSearchResult {
  component: string;
  location: string;
  instructions: string;
  safetyWarnings: string[];
  relatedImages: string[];
  confidence: number;
}

export class MultimodalRAGService {
  private documents: MultimodalDocument[] = [];
  private imageStore: Map<string, string> = new Map();

  async processPDFWithImages(pdfPath: string, productId: string): Promise<void> {
    try {
      // Configure PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

      const loadingTask = pdfjsLib.getDocument(pdfPath);
      const pdf = await loadingTask.promise;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);

        // Extract text content
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        if (pageText.trim()) {
          // Split text into chunks for better retrieval
          const chunks = this.splitTextIntoChunks(pageText, 500);

          for (let i = 0; i < chunks.length; i++) {
            const textDoc: MultimodalDocument = {
              id: `${productId}_page_${pageNum}_text_${i}`,
              content: chunks[i],
              type: 'text',
              pageNumber: pageNum,
              embedding: await this.getTextEmbedding(chunks[i]),
              metadata: {
                section: this.detectSection(chunks[i]),
                safetyLevel: this.detectSafetyLevel(chunks[i])
              }
            };
            this.documents.push(textDoc);
          }
        }

        // Extract images using canvas rendering
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;

        // Convert canvas to base64
        const imageData = canvas.toDataURL('image/png');
        const base64Data = imageData.split(',')[1];

        if (base64Data) {
          const imageId = `${productId}_page_${pageNum}_image`;
          this.imageStore.set(imageId, base64Data);

          // Create image document with CLIP-style embedding
          const imageDoc: MultimodalDocument = {
            id: imageId,
            content: `[Image: Page ${pageNum} - Technical diagram]`,
            type: 'image',
            pageNumber: pageNum,
            imageData: base64Data,
            embedding: await this.getImageEmbedding(base64Data),
            metadata: {
              componentType: await this.detectComponentsInImage(base64Data)
            }
          };
          this.documents.push(imageDoc);
        }
      }
    } catch (error) {
      console.error('Error processing PDF with images:', error);
      throw error;
    }
  }

  async searchComponents(query: string, componentType?: string): Promise<ComponentSearchResult[]> {
    try {
      // Get query embedding
      const queryEmbedding = await this.getTextEmbedding(query);

      // Find relevant documents using cosine similarity
      const relevantDocs = await this.findRelevantDocuments(queryEmbedding, 10);

      // Filter by component type if specified
      const filteredDocs = componentType
        ? relevantDocs.filter(doc =>
            doc.metadata.componentType?.includes(componentType) ||
            doc.content.toLowerCase().includes(componentType.toLowerCase())
          )
        : relevantDocs;

      // Use GPT-4 Vision to analyze the multimodal context
      const results = await this.analyzeWithGPT4Vision(query, filteredDocs);

      return results;
    } catch (error) {
      console.error('Error searching components:', error);
      return [];
    }
  }

  async detectObjectsInImage(imageBase64: string, expectedComponents: string[]): Promise<{
    detectedComponents: Array<{
      name: string;
      confidence: number;
      boundingBox?: { x: number; y: number; width: number; height: number };
      status: 'correct' | 'incorrect' | 'missing';
      issues?: string[];
    }>;
    overallStatus: 'complete' | 'incomplete' | 'error';
    suggestions: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this DEHN electrical installation image for the following components: ${expectedComponents.join(', ')}.

                For each component, determine:
                1. Is it present in the image?
                2. Is it correctly installed/positioned?
                3. Any safety issues or incorrect connections?
                4. Confidence level (0-1)

                Expected components: ${expectedComponents.join(', ')}

                Respond in JSON format with detectedComponents array and overall assessment.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        detectedComponents: analysis.detectedComponents || [],
        overallStatus: analysis.overallStatus || 'error',
        suggestions: analysis.suggestions || ['Unable to analyze image properly']
      };
    } catch (error) {
      console.error('Error in object detection:', error);
      return {
        detectedComponents: [],
        overallStatus: 'error',
        suggestions: ['Error analyzing image. Please try again.']
      };
    }
  }

  private async getTextEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error getting text embedding:', error);
      return [];
    }
  }

  private async getImageEmbedding(imageBase64: string): Promise<number[]> {
    try {
      // Use GPT-4 Vision to describe the image, then embed the description
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe this technical diagram/image in detail, focusing on electrical components, connections, and installation steps. Be specific about component types, wire colors, terminal markings, and safety elements."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.1
      });

      const description = response.choices[0].message.content || '';
      return await this.getTextEmbedding(description);
    } catch (error) {
      console.error('Error getting image embedding:', error);
      return [];
    }
  }

  // Public method for generating image embeddings (for feedback system)
  async generateImageEmbedding(imageBase64: string): Promise<number[]> {
    return await this.getImageEmbedding(imageBase64);
  }

  private async detectComponentsInImage(imageBase64: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identify the main electrical components visible in this image. List them as comma-separated values (e.g., 'surge protector, terminal block, ground wire, live wire')."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 100,
        temperature: 0.1
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error detecting components:', error);
      return '';
    }
  }

  private async findRelevantDocuments(queryEmbedding: number[], k: number): Promise<MultimodalDocument[]> {
    // Calculate cosine similarity with all documents
    const similarities = this.documents.map(doc => ({
      doc,
      similarity: this.cosineSimilarity(queryEmbedding, doc.embedding || [])
    }));

    // Sort by similarity and return top k
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k)
      .map(item => item.doc);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private async analyzeWithGPT4Vision(query: string, docs: MultimodalDocument[]): Promise<ComponentSearchResult[]> {
    try {
      // Prepare multimodal content
      const content: any[] = [
        {
          type: "text",
          text: `Query: ${query}\n\nAnalyze the following technical documentation to find specific components and provide installation guidance:\n\n`
        }
      ];

      // Add text content
      const textDocs = docs.filter(doc => doc.type === 'text');
      if (textDocs.length > 0) {
        const textContent = textDocs.map(doc =>
          `[Page ${doc.pageNumber}]: ${doc.content}`
        ).join('\n\n');

        content.push({
          type: "text",
          text: `Text Documentation:\n${textContent}\n\n`
        });
      }

      // Add images
      const imageDocs = docs.filter(doc => doc.type === 'image' && doc.imageData);
      for (const imageDoc of imageDocs) {
        content.push({
          type: "text",
          text: `\nTechnical Diagram from Page ${imageDoc.pageNumber}:\n`
        });
        content.push({
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${imageDoc.imageData}`
          }
        });
      }

      content.push({
        type: "text",
        text: `\n\nProvide a detailed response in JSON format with the following structure:
        {
          "results": [
            {
              "component": "component name",
              "location": "where to find it",
              "instructions": "step-by-step installation",
              "safetyWarnings": ["warning 1", "warning 2"],
              "relatedImages": ["page numbers with relevant diagrams"],
              "confidence": 0.95
            }
          ]
        }`
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [{ role: "user", content }],
        max_tokens: 1500,
        temperature: 0.1
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{"results": []}');
      return analysis.results || [];
    } catch (error) {
      console.error('Error analyzing with GPT-4 Vision:', error);
      return [];
    }
  }

  private splitTextIntoChunks(text: string, chunkSize: number): string[] {
    const words = text.split(' ');
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }

    return chunks;
  }

  private detectSection(text: string): string {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('safety') || lowerText.includes('warning') || lowerText.includes('caution')) {
      return 'safety';
    } else if (lowerText.includes('installation') || lowerText.includes('mounting')) {
      return 'installation';
    } else if (lowerText.includes('troubleshooting') || lowerText.includes('problem')) {
      return 'troubleshooting';
    } else if (lowerText.includes('specification') || lowerText.includes('technical')) {
      return 'specifications';
    }

    return 'general';
  }

  private detectSafetyLevel(text: string): 'critical' | 'warning' | 'info' {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('danger') || lowerText.includes('fatal') || lowerText.includes('death')) {
      return 'critical';
    } else if (lowerText.includes('warning') || lowerText.includes('caution')) {
      return 'warning';
    }

    return 'info';
  }
}

export const multimodalRAG = new MultimodalRAGService();
