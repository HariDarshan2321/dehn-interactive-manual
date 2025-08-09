# DEHN Interactive Manual AI Platform - Technical Architecture

## 🏗️ System Overview

The DEHN Interactive Manual AI Platform is a sophisticated multimodal RAG (Retrieval-Augmented Generation) system that provides product-specific AI assistance for electrical installation manuals. The system ensures zero hallucination by maintaining isolated embeddings for each product and using only verified manual content.

## 🔄 User Workflow Diagram

```mermaid
graph TB
    A[User Opens App] --> B{QR Code Available?}
    B -->|Yes| C[Scan QR Code]
    B -->|No| D[Browse Product Catalog]

    C --> E[QR Code Recognition]
    D --> F[Product Selection]

    E --> G{Product Found?}
    F --> G

    G -->|No| H[Error: Product Not Found]
    G -->|Yes| I[Load Product Embeddings]

    I --> J{Embeddings Loaded?}
    J -->|No| K[Process PDF + Images]
    J -->|Yes| L[Language Selection]

    K --> M[Extract Text Chunks]
    K --> N[Extract Images]
    M --> O[Generate Text Embeddings]
    N --> P[Generate Image Embeddings]
    O --> Q[Store in Product-Specific Vector DB]
    P --> Q
    Q --> L

    L --> R[Select Language]
    R --> S[Interactive Manual Interface]

    S --> T{User Action}
    T -->|Ask Question| U[AI Q&A Flow]
    T -->|Upload Photo| V[Object Detection Flow]
    T -->|Browse Manual| W[Section Navigation]

    U --> X[Search Product Embeddings]
    X --> Y[Find Relevant Content]
    Y --> Z[GPT-4 Response Generation]
    Z --> AA[Display Answer + Sources]

    V --> BB[Image Analysis]
    BB --> CC[Component Detection]
    CC --> DD[Installation Verification]
    DD --> EE[Visual Feedback]

    W --> FF[Display Manual Sections]
    FF --> GG[Interactive Diagrams]

    AA --> T
    EE --> T
    GG --> T
```

## 🎯 Frontend Architecture

### **Technology Stack**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom DEHN branding
- **State Management**: React hooks (useState, useEffect)
- **Camera Integration**: HTML5 QR Code Scanner
- **Audio**: Web Speech API for voice features

### **Component Architecture**

```mermaid
graph TD
    A[App Layout] --> B[Home Page]
    A --> C[Manual Page]
    A --> D[Demo Page]

    B --> E[QR Scanner Component]
    B --> F[Product Search Component]
    B --> G[Language Selector Component]

    C --> H[AI Chat Interface]
    C --> I[Object Detection Component]
    C --> J[Manual Viewer Component]
    C --> K[Safety Warnings Component]

    D --> L[Multimodal Demo Component]
    L --> M[Component Search Tab]
    L --> N[Object Detection Tab]
    L --> O[Interactive Manual Tab]

    E --> P[Camera Access]
    E --> Q[QR Code Processing]

    F --> R[Product Filtering]
    F --> S[Search Results]

    H --> T[Voice Input]
    H --> U[Text Input]
    H --> V[Response Display]

    I --> W[Image Upload]
    I --> X[Detection Results]
    I --> Y[Visual Overlays]
```

### **State Management Flow**

```mermaid
stateDiagram-v2
    [*] --> AppInitialization
    AppInitialization --> ProductSelection

    ProductSelection --> QRScanning
    ProductSelection --> ManualSearch

    QRScanning --> ProductIdentified
    ManualSearch --> ProductIdentified

    ProductIdentified --> EmbeddingLoading
    EmbeddingLoading --> LanguageSelection
    LanguageSelection --> ManualInterface

    ManualInterface --> AIQuery
    ManualInterface --> ObjectDetection
    ManualInterface --> ManualBrowsing

    AIQuery --> ResponseGeneration
    ObjectDetection --> ImageAnalysis
    ManualBrowsing --> SectionDisplay

    ResponseGeneration --> ManualInterface
    ImageAnalysis --> ManualInterface
    SectionDisplay --> ManualInterface
```

## ⚙️ Backend Architecture

### **Technology Stack**
- **Runtime**: Node.js with Next.js API Routes
- **AI Services**: OpenAI GPT-4 + GPT-4 Vision + Embeddings
- **PDF Processing**: PDF.js for text and image extraction
- **Vector Storage**: In-memory FAISS-like similarity search
- **Image Processing**: Canvas API for PDF image extraction
- **Type Safety**: TypeScript throughout

### **Service Layer Architecture**

```mermaid
graph TB
    A[API Gateway] --> B[Products API]
    A --> C[Ask API]
    A --> D[Detect API]
    A --> E[Embeddings API]

    B --> F[Product Embedding Service]
    C --> F
    D --> F
    E --> G[OpenAI Embeddings]

    F --> H[Multimodal RAG Service]
    H --> I[PDF Processor]
    H --> J[Text Embedder]
    H --> K[Image Embedder]
    H --> L[Vector Search Engine]

    I --> M[PDF.js Text Extraction]
    I --> N[Canvas Image Extraction]

    J --> G
    K --> O[GPT-4 Vision]
    O --> G

    L --> P[Cosine Similarity]
    L --> Q[Exact Text Matching]

    C --> R[GPT-4 Response Generation]
    D --> S[GPT-4 Vision Analysis]
```

### **Data Flow Architecture**

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as API Gateway
    participant PES as Product Embedding Service
    participant MRS as Multimodal RAG Service
    participant OAI as OpenAI Services
    participant VDB as Vector Database

    U->>F: Select Product (QR/Search)
    F->>API: POST /api/products
    API->>PES: loadProductEmbeddings(productId)

    alt Embeddings Not Loaded
        PES->>MRS: processPDFWithImages(pdfPath, productId)
        MRS->>MRS: Extract text chunks
        MRS->>MRS: Extract images from PDF
        MRS->>OAI: Generate text embeddings
        MRS->>OAI: Generate image embeddings (via GPT-4V descriptions)
        MRS->>VDB: Store embeddings with metadata
        VDB-->>PES: Embeddings stored
    end

    PES-->>API: Product embeddings ready
    API-->>F: Product loaded successfully

    U->>F: Ask question about component
    F->>API: POST /api/ask {query, productId}
    API->>PES: searchInProduct(productId, query)
    PES->>VDB: Find relevant documents
    VDB-->>PES: Relevant content + confidence scores
    PES-->>API: Search results

    API->>OAI: GPT-4 with strict prompt + manual content
    OAI-->>API: Formatted response
    API-->>F: Answer + sources + safety warnings
    F-->>U: Display response with page references

    U->>F: Upload installation photo
    F->>API: POST /api/detect {image, productId}
    API->>MRS: detectObjectsInImage(image, expectedComponents)
    MRS->>OAI: GPT-4 Vision analysis
    OAI-->>MRS: Component detection results
    MRS-->>API: Detection + suggestions
    API-->>F: Visual feedback + corrections
    F-->>U: Display detection results with overlays
```

## 🗄️ Data Architecture

### **Product Embedding Structure**

```mermaid
erDiagram
    ProductEmbedding {
        string productId PK
        string productName
        MultimodalDocument[] documents
        boolean isLoaded
        Date lastUpdated
        string manualPath
        number totalPages
        Sections sections
    }

    MultimodalDocument {
        string id PK
        string content
        string type "text|image"
        number pageNumber
        number[] embedding
        string imageData "base64"
        Metadata metadata
    }

    Metadata {
        string section "safety|installation|wiring|troubleshooting|specifications"
        string componentType
        string safetyLevel "critical|warning|info"
    }

    Sections {
        MultimodalDocument[] safety
        MultimodalDocument[] installation
        MultimodalDocument[] wiring
        MultimodalDocument[] troubleshooting
        MultimodalDocument[] specifications
    }

    ProductEmbedding ||--o{ MultimodalDocument : contains
    MultimodalDocument ||--|| Metadata : has
    ProductEmbedding ||--|| Sections : organizes
```

### **Vector Search Implementation**

```mermaid
graph LR
    A[User Query] --> B[Generate Query Embedding]
    B --> C[Search Product Vector Space]

    C --> D[Exact Text Matching]
    C --> E[Semantic Similarity Search]

    D --> F[Filter by Exact Matches]
    E --> G[Calculate Cosine Similarity]
    G --> H[Apply Confidence Threshold]

    F --> I[Combine Results]
    H --> I

    I --> J[Rank by Relevance]
    J --> K[Return Top K Documents]

    K --> L[Extract Safety Warnings]
    K --> M[Extract Related Images]
    K --> N[Format Response]
```

## 🔒 Security & Compliance Architecture

### **Data Protection Flow**

```mermaid
graph TB
    A[User Input] --> B{Contains PII?}
    B -->|Yes| C[Sanitize Input]
    B -->|No| D[Process Normally]
    C --> D

    D --> E[Product-Specific Processing]
    E --> F[Manual Content Only]
    F --> G{Safety Critical?}

    G -->|Yes| H[Exact Quote Required]
    G -->|No| I[AI Formatting Allowed]

    H --> J[Preserve Original Text]
    I --> K[GPT-4 with Strict Rules]

    J --> L[Response Generation]
    K --> L

    L --> M[Source Attribution]
    M --> N[Audit Logging]
    N --> O[Return to User]
```

### **AI Safety Measures**

```mermaid
flowchart TD
    A[AI Request] --> B[Input Validation]
    B --> C[Product Context Isolation]
    C --> D[Manual Content Verification]

    D --> E{Content Available?}
    E -->|No| F[Return "Not Found" Message]
    E -->|Yes| G[Apply Safety Rules]

    G --> H[Temperature: 0.1 for Accuracy]
    G --> I[Max Tokens: 500 for Conciseness]
    G --> J[System Prompt: Strict Rules]

    H --> K[GPT-4 Processing]
    I --> K
    J --> K

    K --> L[Response Validation]
    L --> M{Contains Hallucination?}
    M -->|Yes| N[Reject Response]
    M -->|No| O[Add Source References]

    N --> P[Fallback to Exact Content]
    O --> Q[Return Verified Response]
    P --> Q
```

## 📊 Performance Architecture

### **Embedding Loading Strategy**

```mermaid
graph TB
    A[App Startup] --> B[Initialize Product List]
    B --> C{Preload All?}

    C -->|Demo Mode| D[Load All 15 Products]
    C -->|Production| E[Lazy Loading]

    D --> F[Parallel Processing]
    F --> G[Progress Tracking]
    G --> H[Cache in Memory]

    E --> I[Load on Demand]
    I --> J{Already Loaded?}
    J -->|Yes| K[Return Cached]
    J -->|No| L[Process PDF]

    L --> M[Text Extraction]
    L --> N[Image Extraction]
    M --> O[Chunk Text]
    N --> P[Describe Images]

    O --> Q[Generate Embeddings]
    P --> R[Generate Image Embeddings]

    Q --> S[Store in Vector DB]
    R --> S
    S --> T[Mark as Loaded]
    T --> K
```

### **Response Time Optimization**

```mermaid
graph LR
    A[User Query] --> B[Check Cache]
    B --> C{Cached?}

    C -->|Yes| D[Return Cached Result]
    C -->|No| E[Vector Search]

    E --> F[Parallel Processing]
    F --> G[Text Search]
    F --> H[Image Search]

    G --> I[Combine Results]
    H --> I

    I --> J[GPT-4 Processing]
    J --> K[Cache Result]
    K --> L[Return Response]

    D --> M[Update Access Time]
    L --> N[Log Performance Metrics]
    M --> N
```

## 🔧 API Specifications

### **Core Endpoints**

```mermaid
graph TB
    A[API Gateway] --> B["/api/products"]
    A --> C["/api/ask"]
    A --> D["/api/detect"]
    A --> E["/api/embeddings"]

    B --> F["GET: List products<br/>POST: QR code lookup"]
    C --> G["POST: AI Q&A<br/>Body: {query, productId, sectionFilter}"]
    D --> H["POST: Object detection<br/>Body: FormData{image, productId, stepNumber}"]
    E --> I["POST: Generate embeddings<br/>Body: {text}"]

    F --> J["Response: {products[], categories[]}"]
    G --> K["Response: {answer, sources[], confidence, safetyWarnings[]}"]
    H --> L["Response: {detectedComponents[], overallStatus, suggestions[]}"]
    I --> M["Response: {embedding[], model, usage}"]
```

### **Error Handling Flow**

```mermaid
graph TB
    A[API Request] --> B{Valid Input?}
    B -->|No| C[400 Bad Request]
    B -->|Yes| D{Product Exists?}

    D -->|No| E[404 Not Found]
    D -->|Yes| F{Embeddings Available?}

    F -->|No| G[Load Embeddings]
    F -->|Yes| H[Process Request]

    G --> I{Load Success?}
    I -->|No| J[500 Internal Error]
    I -->|Yes| H

    H --> K{AI Service Available?}
    K -->|No| L[503 Service Unavailable]
    K -->|Yes| M[Generate Response]

    M --> N{Response Valid?}
    N -->|No| O[Fallback Response]
    N -->|Yes| P[200 Success]

    C --> Q[Error Logging]
    E --> Q
    J --> Q
    L --> Q
    O --> Q
    P --> R[Success Logging]
```

## 🚀 Deployment Architecture

### **Production Deployment Flow**

```mermaid
graph TB
    A[Development] --> B[Build Process]
    B --> C[Type Checking]
    B --> D[Bundle Optimization]
    B --> E[Asset Compilation]

    C --> F{Types Valid?}
    F -->|No| G[Fix Type Errors]
    F -->|Yes| H[Continue Build]
    G --> C

    D --> I[Code Splitting]
    I --> J[Tree Shaking]
    J --> K[Minification]

    E --> L[CSS Processing]
    L --> M[Image Optimization]

    H --> N[Production Bundle]
    K --> N
    M --> N

    N --> O[Container Build]
    O --> P[Environment Setup]
    P --> Q[Health Checks]

    Q --> R{Health OK?}
    R -->|No| S[Deployment Failed]
    R -->|Yes| T[Deploy to Production]

    T --> U[Load Balancer]
    U --> V[Multiple Instances]
    V --> W[Monitoring Setup]
```

### **Scaling Strategy**

```mermaid
graph LR
    A[Load Balancer] --> B[App Instance 1]
    A --> C[App Instance 2]
    A --> D[App Instance N]

    B --> E[Shared Vector Cache]
    C --> E
    D --> E

    E --> F[Redis Cluster]

    B --> G[OpenAI API]
    C --> G
    D --> G

    G --> H[Rate Limiting]
    H --> I[Request Queuing]
    I --> J[Response Caching]
```

## 🔄 Feedback System for Continuous Model Training

### **Data Science Approach to Model Improvement**

The DEHN Interactive Manual AI Platform implements a sophisticated feedback loop system that transforms user interactions into valuable training data for continuous model improvement. This system addresses the current limitation of relying on mock data by creating a robust pipeline for collecting, validating, and utilizing real-world installation photos.

### **Feedback Collection Architecture**

```mermaid
graph TB
    A[User Completes Installation] --> B[AI Verification Complete]
    B --> C[Feedback Collection Interface]
    C --> D[User Photo Upload]
    D --> E[Metadata Collection]
    E --> F[Quality Assessment]

    F --> G{Photo Quality OK?}
    G -->|No| H[Request Better Photo]
    G -->|Yes| I[Store in Feedback Database]

    I --> J[Expert Review Queue]
    J --> K[Manual Annotation]
    K --> L[Training Dataset Creation]
    L --> M[Model Retraining Pipeline]

    H --> D
    M --> N[A/B Testing]
    N --> O[Model Deployment]
    O --> P[Performance Monitoring]
    P --> Q[Feedback Loop Metrics]
```

### **Multimodal Data Collection Strategy**

Based on the CLIP-based multimodal RAG approach, the feedback system collects:

1. **Installation Photos**: High-resolution images of completed installations
2. **Component Annotations**: Bounding boxes and labels for detected components
3. **Installation Context**: Product ID, step number, environmental conditions
4. **User Feedback**: Correctness ratings, issue reports, suggestions
5. **Expert Validation**: Professional electrician reviews and corrections

### **CLIP-Enhanced Feedback Processing**

```mermaid
graph LR
    A[User Photo] --> B[CLIP Image Encoder]
    B --> C[Image Embeddings]
    C --> D[Similarity Search]
    D --> E[Reference Manual Images]

    F[Installation Description] --> G[CLIP Text Encoder]
    G --> H[Text Embeddings]
    H --> I[Unified Embedding Space]

    C --> I
    I --> J[Quality Assessment]
    J --> K[Automatic Annotation]
    K --> L[Expert Review Queue]
```

### **Feedback Data Schema**

```typescript
interface FeedbackEntry {
  id: string;
  timestamp: Date;
  userId: string;
  productId: string;
  stepNumber: number;

  // Image data
  originalImage: {
    base64Data: string;
    metadata: ImageMetadata;
    clipEmbedding: number[];
  };

  // AI Analysis
  aiAnalysis: {
    detectedComponents: ComponentDetection[];
    overallStatus: 'complete' | 'incomplete' | 'error';
    confidence: number;
    suggestions: string[];
  };

  // User feedback
  userFeedback: {
    correctnessRating: number; // 1-5 scale
    reportedIssues: string[];
    additionalComments: string;
    wouldRecommend: boolean;
  };

  // Expert validation
  expertReview?: {
    reviewerId: string;
    reviewDate: Date;
    actualComponents: ComponentAnnotation[];
    correctnessScore: number;
    trainingValue: 'high' | 'medium' | 'low';
    notes: string;
  };

  // Training metadata
  trainingMetadata: {
    isValidForTraining: boolean;
    qualityScore: number;
    annotationComplete: boolean;
    usedInTraining: boolean;
    modelVersion: string;
  };
}
```

### **Continuous Learning Pipeline**

```mermaid
graph TB
    A[Feedback Collection] --> B[Data Preprocessing]
    B --> C[Quality Filtering]
    C --> D[Expert Annotation]
    D --> E[Dataset Augmentation]

    E --> F[CLIP Fine-tuning]
    E --> G[Object Detection Training]
    E --> H[Classification Model Training]

    F --> I[Model Validation]
    G --> I
    H --> I

    I --> J{Performance Improved?}
    J -->|Yes| K[A/B Testing]
    J -->|No| L[Hyperparameter Tuning]

    K --> M[Gradual Rollout]
    M --> N[Performance Monitoring]
    N --> O[Feedback Analysis]
    O --> A

    L --> F
```

### **Implementation Components**

#### **1. Feedback Collection API**

```typescript
// POST /api/feedback/submit
interface FeedbackSubmissionRequest {
  productId: string;
  stepNumber: number;
  installationImage: File;
  userRating: number;
  comments?: string;
  reportedIssues?: string[];
}

// GET /api/feedback/stats
interface FeedbackStats {
  totalSubmissions: number;
  averageRating: number;
  commonIssues: string[];
  improvementTrends: TrendData[];
}
```

#### **2. Expert Review Interface**

```typescript
interface ExpertReviewInterface {
  pendingReviews: FeedbackEntry[];
  annotationTools: {
    boundingBoxTool: BoundingBoxAnnotator;
    componentLabeler: ComponentLabeler;
    qualityAssessment: QualityScorer;
  };
  batchProcessing: BatchReviewTools;
  qualityMetrics: ReviewQualityMetrics;
}
```

#### **3. Training Data Management**

```typescript
interface TrainingDataManager {
  datasetVersioning: DatasetVersion[];
  qualityFiltering: QualityFilter;
  augmentationPipeline: DataAugmentation;
  exportFormats: {
    coco: COCOExporter;
    yolo: YOLOExporter;
    clip: CLIPDatasetExporter;
  };
}
```

### **Model Training Architecture**

```mermaid
graph TB
    A[Feedback Dataset] --> B[Data Validation]
    B --> C[Train/Val/Test Split]
    C --> D[Data Augmentation]

    D --> E[CLIP Fine-tuning]
    D --> F[Object Detection Training]
    D --> G[Classification Training]

    E --> H[Multimodal Embeddings]
    F --> I[Component Detection]
    G --> J[Installation Classification]

    H --> K[Model Ensemble]
    I --> K
    J --> K

    K --> L[Validation Testing]
    L --> M{Performance Metrics OK?}
    M -->|Yes| N[Model Registry]
    M -->|No| O[Hyperparameter Optimization]

    O --> E
    N --> P[A/B Testing Framework]
```

### **Quality Assurance Metrics**

```typescript
interface QualityMetrics {
  // Data quality
  imageQuality: {
    resolution: number;
    brightness: number;
    sharpness: number;
    relevance: number;
  };

  // Annotation quality
  annotationAccuracy: number;
  interAnnotatorAgreement: number;
  completeness: number;

  // Model performance
  detectionAccuracy: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  userSatisfactionScore: number;

  // Business metrics
  installationSuccessRate: number;
  userRetentionRate: number;
  supportTicketReduction: number;
}
```

### **Privacy and Compliance**

```mermaid
graph LR
    A[User Photo] --> B[Privacy Check]
    B --> C[PII Detection]
    C --> D[Data Anonymization]
    D --> E[Consent Verification]
    E --> F[Secure Storage]

    F --> G[Access Control]
    G --> H[Audit Logging]
    H --> I[Retention Policy]
    I --> J[Data Deletion]
```

### **Deployment Strategy**

1. **Phase 1**: Feedback collection interface with basic quality filtering
2. **Phase 2**: Expert review system and manual annotation tools
3. **Phase 3**: Automated training pipeline with CLIP fine-tuning
4. **Phase 4**: A/B testing framework and gradual model deployment
5. **Phase 5**: Full continuous learning system with real-time updates

### **Success Metrics**

- **Data Collection**: 1000+ high-quality annotated images per month
- **Model Performance**: 15% improvement in detection accuracy quarterly
- **User Satisfaction**: 90%+ positive feedback on AI suggestions
- **Business Impact**: 25% reduction in installation support tickets

This comprehensive feedback system transforms the DEHN Interactive Manual AI Platform from a static system into a continuously improving, self-learning platform that gets better with every user interaction while maintaining the highest standards of privacy and data quality.

This technical architecture ensures the DEHN Interactive Manual AI Platform delivers reliable, accurate, and scalable AI-powered assistance while maintaining absolute safety compliance and zero hallucination through product-specific embedding isolation, enhanced by continuous learning from real-world user feedback.
