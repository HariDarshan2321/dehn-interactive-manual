import { multimodalRAG, MultimodalDocument } from './multimodal-rag';

export interface ProductEmbedding {
  productId: string;
  productName: string;
  documents: MultimodalDocument[];
  isLoaded: boolean;
  lastUpdated: Date;
  manualPath: string;
  totalPages: number;
  sections: {
    safety: MultimodalDocument[];
    installation: MultimodalDocument[];
    wiring: MultimodalDocument[];
    troubleshooting: MultimodalDocument[];
    specifications: MultimodalDocument[];
  };
}

export class ProductEmbeddingService {
  private productEmbeddings: Map<string, ProductEmbedding> = new Map();
  private loadingPromises: Map<string, Promise<void>> = new Map();

  // 15 DEHN Products for demo
  private readonly PRODUCTS = [
    { id: 'tnc-255', name: 'TNC 255 Surge Protector', manual: '/pdfs/tnc-255.pdf' },
    { id: 'dv-m2-255', name: 'DV M2 TNC 255 FM', manual: '/pdfs/dv-m2-255.pdf' },
    { id: 'blitzductor-xt', name: 'BLITZDUCTOR XT', manual: '/pdfs/blitzductor-xt.pdf' },
    { id: 'dehnguard-m-255', name: 'DEHNguard M 255', manual: '/pdfs/dehnguard-m-255.pdf' },
    { id: 'dehnventil-m-255', name: 'DEHNventil M 255', manual: '/pdfs/dehnventil-m-255.pdf' },
    { id: 'dehnrail-m-255', name: 'DEHNrail M 255', manual: '/pdfs/dehnrail-m-255.pdf' },
    { id: 'dehnbox-db-255', name: 'DEHNbox DB 255', manual: '/pdfs/dehnbox-db-255.pdf' },
    { id: 'dehnconnect-dc-255', name: 'DEHNconnect DC 255', manual: '/pdfs/dehnconnect-dc-255.pdf' },
    { id: 'dehnpatch-dp-255', name: 'DEHNpatch DP 255', manual: '/pdfs/dehnpatch-dp-255.pdf' },
    { id: 'dehnflex-m-255', name: 'DEHNflex M 255', manual: '/pdfs/dehnflex-m-255.pdf' },
    { id: 'dehnshield-zp-255', name: 'DEHNshield ZP 255', manual: '/pdfs/dehnshield-zp-255.pdf' },
    { id: 'dehnstrike-ys-255', name: 'DEHNstrike YS 255', manual: '/pdfs/dehnstrike-ys-255.pdf' },
    { id: 'dehncombo-yp-255', name: 'DEHNcombo YP 255', manual: '/pdfs/dehncombo-yp-255.pdf' },
    { id: 'dehnlimit-se-255', name: 'DEHNlimit SE 255', manual: '/pdfs/dehnlimit-se-255.pdf' },
    { id: 'dehnprotector-pr-255', name: 'DEHNprotector PR 255', manual: '/pdfs/dehnprotector-pr-255.pdf' }
  ];

  constructor() {
    this.initializeProducts();
  }

  private initializeProducts() {
    this.PRODUCTS.forEach(product => {
      this.productEmbeddings.set(product.id, {
        productId: product.id,
        productName: product.name,
        documents: [],
        isLoaded: false,
        lastUpdated: new Date(),
        manualPath: product.manual,
        totalPages: 0,
        sections: {
          safety: [],
          installation: [],
          wiring: [],
          troubleshooting: [],
          specifications: []
        }
      });
    });
  }

  async loadProductEmbeddings(productId: string): Promise<ProductEmbedding> {
    // Check if already loaded
    const existing = this.productEmbeddings.get(productId);
    if (existing?.isLoaded) {
      return existing;
    }

    // Check if currently loading
    if (this.loadingPromises.has(productId)) {
      await this.loadingPromises.get(productId);
      return this.productEmbeddings.get(productId)!;
    }

    // Start loading process
    const loadingPromise = this.performProductLoading(productId);
    this.loadingPromises.set(productId, loadingPromise);

    try {
      await loadingPromise;
      return this.productEmbeddings.get(productId)!;
    } finally {
      this.loadingPromises.delete(productId);
    }
  }

  private async performProductLoading(productId: string): Promise<void> {
    const productInfo = this.PRODUCTS.find(p => p.id === productId);
    if (!productInfo) {
      throw new Error(`Product ${productId} not found`);
    }

    console.log(`Loading embeddings for ${productInfo.name}...`);

    try {
      // Create a new RAG instance specifically for this product
      const productRAG = new (await import('./multimodal-rag')).MultimodalRAGService();

      // Process PDF with images - this creates embeddings for text and images
      await productRAG.processPDFWithImages(productInfo.manual, productId);

      // Get the processed documents
      const documents = (productRAG as any).documents as MultimodalDocument[];

      // Organize documents by section
      const sections = {
        safety: documents.filter(doc => doc.metadata.section === 'safety'),
        installation: documents.filter(doc => doc.metadata.section === 'installation'),
        wiring: documents.filter(doc => doc.content.toLowerCase().includes('wiring') || doc.content.toLowerCase().includes('wire')),
        troubleshooting: documents.filter(doc => doc.metadata.section === 'troubleshooting'),
        specifications: documents.filter(doc => doc.metadata.section === 'specifications')
      };

      // Update the product embedding
      const productEmbedding = this.productEmbeddings.get(productId)!;
      productEmbedding.documents = documents;
      productEmbedding.isLoaded = true;
      productEmbedding.lastUpdated = new Date();
      productEmbedding.totalPages = Math.max(...documents.map(doc => doc.pageNumber));
      productEmbedding.sections = sections;

      console.log(`✅ Loaded ${documents.length} documents for ${productInfo.name}`);
      console.log(`   - Text chunks: ${documents.filter(d => d.type === 'text').length}`);
      console.log(`   - Images: ${documents.filter(d => d.type === 'image').length}`);
      console.log(`   - Safety sections: ${sections.safety.length}`);
      console.log(`   - Installation sections: ${sections.installation.length}`);

    } catch (error) {
      console.error(`Failed to load embeddings for ${productId}:`, error);
      throw error;
    }
  }

  async searchInProduct(productId: string, query: string, sectionFilter?: string): Promise<{
    results: MultimodalDocument[];
    exactMatches: MultimodalDocument[];
    confidence: number;
  }> {
    const productEmbedding = await this.loadProductEmbeddings(productId);

    if (!productEmbedding.isLoaded) {
      throw new Error(`Product ${productId} embeddings not loaded`);
    }

    // Get query embedding
    const queryEmbedding = await this.getTextEmbedding(query);

    // Filter documents by section if specified
    let searchDocs = productEmbedding.documents;
    if (sectionFilter && productEmbedding.sections[sectionFilter as keyof typeof productEmbedding.sections]) {
      searchDocs = productEmbedding.sections[sectionFilter as keyof typeof productEmbedding.sections];
    }

    // Find exact text matches first (no hallucination)
    const exactMatches = searchDocs.filter(doc =>
      doc.content.toLowerCase().includes(query.toLowerCase()) ||
      query.toLowerCase().split(' ').some(word =>
        word.length > 3 && doc.content.toLowerCase().includes(word)
      )
    );

    // Calculate similarities for semantic search
    const similarities = searchDocs.map(doc => ({
      doc,
      similarity: this.cosineSimilarity(queryEmbedding, doc.embedding || [])
    }));

    // Sort by similarity and get top results
    const semanticResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .filter(item => item.similarity > 0.3) // Minimum similarity threshold
      .map(item => item.doc);

    // Combine exact matches with semantic results
    const allResults = [...exactMatches, ...semanticResults];
    const uniqueResults = Array.from(new Map(allResults.map(doc => [doc.id, doc])).values());

    // Calculate overall confidence
    const avgSimilarity = similarities.slice(0, 5).reduce((sum, item) => sum + item.similarity, 0) / 5;
    const confidence = exactMatches.length > 0 ? 0.95 : Math.min(avgSimilarity * 1.2, 0.9);

    return {
      results: uniqueResults.slice(0, 10),
      exactMatches,
      confidence
    };
  }

  async getProductSections(productId: string): Promise<{
    safety: string[];
    installation: string[];
    wiring: string[];
    troubleshooting: string[];
    specifications: string[];
  }> {
    const productEmbedding = await this.loadProductEmbeddings(productId);

    return {
      safety: productEmbedding.sections.safety.map(doc => doc.content).slice(0, 5),
      installation: productEmbedding.sections.installation.map(doc => doc.content).slice(0, 5),
      wiring: productEmbedding.sections.wiring.map(doc => doc.content).slice(0, 5),
      troubleshooting: productEmbedding.sections.troubleshooting.map(doc => doc.content).slice(0, 5),
      specifications: productEmbedding.sections.specifications.map(doc => doc.content).slice(0, 5)
    };
  }

  async getProductImages(productId: string): Promise<{
    pageNumber: number;
    imageData: string;
    description: string;
  }[]> {
    const productEmbedding = await this.loadProductEmbeddings(productId);

    return productEmbedding.documents
      .filter(doc => doc.type === 'image' && doc.imageData)
      .map(doc => ({
        pageNumber: doc.pageNumber,
        imageData: doc.imageData!,
        description: doc.content
      }));
  }

  getAvailableProducts(): { id: string; name: string; isLoaded: boolean }[] {
    return this.PRODUCTS.map(product => ({
      id: product.id,
      name: product.name,
      isLoaded: this.productEmbeddings.get(product.id)?.isLoaded || false
    }));
  }

  async preloadAllProducts(): Promise<void> {
    console.log('🚀 Pre-loading all 15 product embeddings...');

    const loadPromises = this.PRODUCTS.map(product =>
      this.loadProductEmbeddings(product.id).catch(error => {
        console.error(`Failed to load ${product.name}:`, error);
        return null;
      })
    );

    await Promise.all(loadPromises);

    const loadedCount = Array.from(this.productEmbeddings.values())
      .filter(p => p.isLoaded).length;

    console.log(`✅ Pre-loaded ${loadedCount}/15 products successfully`);
  }

  private async getTextEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Failed to get embedding');
      }

      const result = await response.json();
      return result.embedding;
    } catch (error) {
      console.error('Error getting text embedding:', error);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magnitudeA * magnitudeB);
  }
}

export const productEmbeddingService = new ProductEmbeddingService();
