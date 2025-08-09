import * as pdfjsLib from 'pdfjs-dist';

export interface PDFContent {
  text: string;
  pages: PDFPage[];
  metadata: PDFMetadata;
}

export interface PDFPage {
  pageNumber: number;
  text: string;
  sections: PDFSection[];
}

export interface PDFSection {
  title: string;
  content: string;
  type: 'safety' | 'installation' | 'troubleshooting' | 'specifications' | 'general';
  pageNumber: number;
}

export interface PDFMetadata {
  title: string;
  productId: string;
  version: string;
  language: string;
}

export class PDFProcessor {
  private static instance: PDFProcessor;

  static getInstance(): PDFProcessor {
    if (!PDFProcessor.instance) {
      PDFProcessor.instance = new PDFProcessor();
    }
    return PDFProcessor.instance;
  }

  async extractContent(pdfPath: string, productId: string): Promise<PDFContent> {
    try {
      // Configure PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      
      const loadingTask = pdfjsLib.getDocument(pdfPath);
      const pdf = await loadingTask.promise;
      
      const pages: PDFPage[] = [];
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
        
        const sections = this.extractSections(pageText, pageNum);
        
        pages.push({
          pageNumber: pageNum,
          text: pageText,
          sections
        });
      }
      
      const metadata = await this.extractMetadata(pdf, productId);
      
      return {
        text: fullText,
        pages,
        metadata
      };
    } catch (error) {
      console.error('PDF processing error:', error);
      throw new Error(`Failed to process PDF: ${error}`);
    }
  }

  private extractSections(pageText: string, pageNumber: number): PDFSection[] {
    const sections: PDFSection[] = [];
    const text = pageText.toLowerCase();
    
    // Safety section detection
    if (text.includes('safety') || text.includes('warning') || text.includes('caution') || text.includes('danger')) {
      sections.push({
        title: 'Safety Information',
        content: this.extractSafetyContent(pageText),
        type: 'safety',
        pageNumber
      });
    }
    
    // Installation section detection
    if (text.includes('installation') || text.includes('mounting') || text.includes('connect')) {
      sections.push({
        title: 'Installation Instructions',
        content: this.extractInstallationContent(pageText),
        type: 'installation',
        pageNumber
      });
    }
    
    // Troubleshooting section detection
    if (text.includes('troubleshooting') || text.includes('problem') || text.includes('fault')) {
      sections.push({
        title: 'Troubleshooting',
        content: this.extractTroubleshootingContent(pageText),
        type: 'troubleshooting',
        pageNumber
      });
    }
    
    // Specifications section detection
    if (text.includes('specification') || text.includes('technical data') || text.includes('dimensions')) {
      sections.push({
        title: 'Technical Specifications',
        content: this.extractSpecificationsContent(pageText),
        type: 'specifications',
        pageNumber
      });
    }
    
    return sections;
  }

  private extractSafetyContent(pageText: string): string {
    // Extract safety-related content with context
    const lines = pageText.split('\n');
    const safetyLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('warning') || line.includes('caution') || line.includes('danger') || line.includes('safety')) {
        // Include the safety line and next 2-3 lines for context
        safetyLines.push(lines[i]);
        for (let j = 1; j <= 3 && i + j < lines.length; j++) {
          safetyLines.push(lines[i + j]);
        }
      }
    }
    
    return safetyLines.join('\n');
  }

  private extractInstallationContent(pageText: string): string {
    // Extract installation steps and procedures
    const lines = pageText.split('\n');
    const installationLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('step') || line.includes('install') || line.includes('mount') || line.includes('connect')) {
        installationLines.push(lines[i]);
        // Include context lines
        for (let j = 1; j <= 2 && i + j < lines.length; j++) {
          installationLines.push(lines[i + j]);
        }
      }
    }
    
    return installationLines.join('\n');
  }

  private extractTroubleshootingContent(pageText: string): string {
    // Extract troubleshooting information
    const lines = pageText.split('\n');
    const troubleshootingLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('problem') || line.includes('fault') || line.includes('error') || line.includes('troubleshoot')) {
        troubleshootingLines.push(lines[i]);
        // Include solution context
        for (let j = 1; j <= 3 && i + j < lines.length; j++) {
          troubleshootingLines.push(lines[i + j]);
        }
      }
    }
    
    return troubleshootingLines.join('\n');
  }

  private extractSpecificationsContent(pageText: string): string {
    // Extract technical specifications
    const lines = pageText.split('\n');
    const specLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('specification') || line.includes('technical') || line.includes('dimension') || 
          line.includes('voltage') || line.includes('current') || line.includes('temperature')) {
        specLines.push(lines[i]);
        // Include specification details
        for (let j = 1; j <= 2 && i + j < lines.length; j++) {
          specLines.push(lines[i + j]);
        }
      }
    }
    
    return specLines.join('\n');
  }

  private async extractMetadata(pdf: any, productId: string): Promise<PDFMetadata> {
    const metadata = await pdf.getMetadata();
    
    return {
      title: metadata.info?.Title || `DEHN ${productId} Manual`,
      productId,
      version: metadata.info?.Subject || '1.0',
      language: 'en' // Default, could be detected from content
    };
  }

  // Method to find relevant content for AI queries
  findRelevantContent(pdfContent: PDFContent, query: string): string {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(' ');
    
    let relevantContent = '';
    let maxRelevance = 0;
    
    // Check each page for relevance
    for (const page of pdfContent.pages) {
      const pageText = page.text.toLowerCase();
      let relevance = 0;
      
      // Calculate relevance score
      for (const keyword of keywords) {
        const occurrences = (pageText.match(new RegExp(keyword, 'g')) || []).length;
        relevance += occurrences;
      }
      
      if (relevance > maxRelevance) {
        maxRelevance = relevance;
        relevantContent = page.text;
      }
      
      // Also check sections for higher relevance
      for (const section of page.sections) {
        const sectionText = section.content.toLowerCase();
        let sectionRelevance = 0;
        
        for (const keyword of keywords) {
          const occurrences = (sectionText.match(new RegExp(keyword, 'g')) || []).length;
          sectionRelevance += occurrences * 2; // Sections get higher weight
        }
        
        if (sectionRelevance > maxRelevance) {
          maxRelevance = sectionRelevance;
          relevantContent = section.content;
        }
      }
    }
    
    return relevantContent || pdfContent.text.substring(0, 2000); // Fallback to first 2000 chars
  }
}

export const pdfProcessor = PDFProcessor.getInstance();
