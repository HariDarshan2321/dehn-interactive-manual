import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIResponse {
  answer: string;
  sources: string[];
  confidence: number;
  relatedQuestions: string[];
}

export class DEHNAIAssistant {
  private productContext: Map<string, string> = new Map();

  async processQuery(
    query: string, 
    productId: string, 
    manualContent: string,
    language: string = 'en'
  ): Promise<AIResponse> {
    const prompt = this.buildPrompt(query, productId, manualContent, language);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a DEHN electrical safety expert assistant. Always prioritize safety and provide accurate information based only on the provided manual content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for accuracy
        max_tokens: 500,
      });

      const aiAnswer = response.choices[0].message.content || "";
      
      return {
        answer: aiAnswer,
        sources: this.extractSources(manualContent, query),
        confidence: this.calculateConfidence(aiAnswer, manualContent),
        relatedQuestions: this.generateRelatedQuestions(query, productId)
      };
    } catch (error) {
      console.error('AI processing error:', error);
      return {
        answer: "I'm sorry, I couldn't process your question. Please refer to the official manual or contact support.",
        sources: [],
        confidence: 0,
        relatedQuestions: []
      };
    }
  }

  private buildPrompt(query: string, productId: string, manualContent: string, language: string): string {
    return `
Product: ${productId}
Language: ${language}
Manual Content: ${manualContent}

User Question: "${query}"

Instructions:
1. Answer ONLY based on the provided manual content
2. If safety-related, include exact safety warnings from the manual
3. Provide step-by-step instructions when applicable
4. Reference specific page numbers or sections when possible
5. If information is not in the manual, say "This information is not available in the current manual"
6. Keep responses concise and practical for field technicians
7. Always prioritize safety

Response format:
- Direct answer to the question
- Safety warnings (if applicable)
- Step-by-step instructions (if applicable)
- Manual reference (page/section)
`;
  }

  private extractSources(manualContent: string, query: string): string[] {
    // Simple keyword-based source extraction
    const keywords = query.toLowerCase().split(' ');
    const sources: string[] = [];
    
    // Mock source extraction - in real implementation, this would be more sophisticated
    if (keywords.includes('torque') || keywords.includes('tight')) {
      sources.push('Page 12, Section 3.2 - Installation Specifications');
    }
    if (keywords.includes('wire') || keywords.includes('connect')) {
      sources.push('Page 8, Section 2.4 - Wiring Instructions');
    }
    if (keywords.includes('safety') || keywords.includes('warning')) {
      sources.push('Page 3, Section 1.1 - Safety Warnings');
    }
    
    return sources;
  }

  private calculateConfidence(answer: string, manualContent: string): number {
    // Simple confidence calculation based on answer length and content match
    if (answer.includes("not available") || answer.includes("sorry")) {
      return 0.1;
    }
    
    const answerWords = answer.toLowerCase().split(' ');
    const manualWords = manualContent.toLowerCase().split(' ');
    const matchCount = answerWords.filter(word => manualWords.includes(word)).length;
    
    return Math.min(0.95, matchCount / answerWords.length);
  }

  private generateRelatedQuestions(query: string, productId: string): string[] {
    // Mock related questions - in real implementation, this would be more sophisticated
    const relatedQuestions = [
      "What tools do I need for installation?",
      "What are the safety requirements?",
      "How do I test the installation?",
      "What is the recommended torque specification?",
      "How do I troubleshoot common issues?"
    ];
    
    return relatedQuestions.slice(0, 3);
  }
}

export const aiAssistant = new DEHNAIAssistant();
