import { NextRequest, NextResponse } from 'next/server';
import { multimodalRAG } from '@/lib/ai/multimodal-rag';

interface FeedbackEntry {
  id: string;
  timestamp: Date;
  userId: string;
  productId: string;
  stepNumber: number;
  originalImage: {
    base64Data: string;
    metadata: any;
    clipEmbedding: number[];
  };
  aiAnalysis: {
    detectedComponents: any[];
    overallStatus: 'complete' | 'incomplete' | 'error';
    confidence: number;
    suggestions: string[];
  };
  userFeedback: {
    correctnessRating: number;
    reportedIssues: string[];
    additionalComments: string;
    wouldRecommend: boolean;
  };
  trainingMetadata: {
    isValidForTraining: boolean;
    qualityScore: number;
    annotationComplete: boolean;
    usedInTraining: boolean;
    modelVersion: string;
  };
}

// In-memory storage for demo (in production, use a proper database)
const feedbackDatabase: FeedbackEntry[] = [];
const feedbackStats = {
  totalSubmissions: 0,
  averageRating: 0,
  commonIssues: [] as string[],
  improvementTrends: [] as any[]
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const productId = formData.get('productId') as string;
    const stepNumber = parseInt(formData.get('stepNumber') as string);
    const userRating = parseInt(formData.get('userRating') as string);
    const comments = formData.get('comments') as string || '';
    const reportedIssues = JSON.parse(formData.get('reportedIssues') as string || '[]');
    const image = formData.get('installationImage') as File;

    if (!image || !productId || !stepNumber || !userRating) {
      return NextResponse.json(
        { error: 'Missing required fields: image, productId, stepNumber, userRating' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Generate CLIP embedding for the image (using existing multimodal RAG service)
    const clipEmbedding = await multimodalRAG.generateImageEmbedding(base64Image);

    // Perform AI analysis on the uploaded image
    const aiAnalysis = await multimodalRAG.detectObjectsInImage(
      base64Image,
      [`${productId}_expected_components`] // This would be dynamically determined
    );

    // Calculate quality score based on image properties and AI confidence
    const avgConfidence = aiAnalysis.detectedComponents.length > 0
      ? aiAnalysis.detectedComponents.reduce((sum, comp) => sum + comp.confidence, 0) / aiAnalysis.detectedComponents.length
      : 0;
    const qualityScore = calculateImageQuality(base64Image, avgConfidence);

    // Create feedback entry
    const feedbackEntry: FeedbackEntry = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: 'demo_user', // In production, get from authentication
      productId,
      stepNumber,
      originalImage: {
        base64Data: base64Image,
        metadata: {
          filename: image.name,
          size: image.size,
          type: image.type,
          uploadTime: new Date().toISOString()
        },
        clipEmbedding
      },
      aiAnalysis: {
        detectedComponents: aiAnalysis.detectedComponents || [],
        overallStatus: aiAnalysis.overallStatus || 'incomplete',
        confidence: avgConfidence,
        suggestions: aiAnalysis.suggestions || []
      },
      userFeedback: {
        correctnessRating: userRating,
        reportedIssues,
        additionalComments: comments,
        wouldRecommend: userRating >= 4
      },
      trainingMetadata: {
        isValidForTraining: qualityScore > 0.7 && userRating >= 3,
        qualityScore,
        annotationComplete: false,
        usedInTraining: false,
        modelVersion: 'v1.0.0'
      }
    };

    // Store in database
    feedbackDatabase.push(feedbackEntry);

    // Update statistics
    updateFeedbackStats(feedbackEntry);

    // Queue for expert review if high value
    if (feedbackEntry.trainingMetadata.qualityScore > 0.8) {
      await queueForExpertReview(feedbackEntry);
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedbackId: feedbackEntry.id,
        qualityScore: feedbackEntry.trainingMetadata.qualityScore,
        queuedForReview: feedbackEntry.trainingMetadata.qualityScore > 0.8,
        aiAnalysis: feedbackEntry.aiAnalysis
      }
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback submission' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'stats') {
      return NextResponse.json({
        success: true,
        data: {
          ...feedbackStats,
          recentSubmissions: feedbackDatabase.slice(-10).map(entry => ({
            id: entry.id,
            productId: entry.productId,
            rating: entry.userFeedback.correctnessRating,
            timestamp: entry.timestamp,
            qualityScore: entry.trainingMetadata.qualityScore
          }))
        }
      });
    }

    if (type === 'pending-review') {
      const pendingReviews = feedbackDatabase.filter(
        entry => !entry.trainingMetadata.annotationComplete &&
                entry.trainingMetadata.qualityScore > 0.7
      );

      return NextResponse.json({
        success: true,
        data: {
          pendingReviews: pendingReviews.map(entry => ({
            id: entry.id,
            productId: entry.productId,
            stepNumber: entry.stepNumber,
            timestamp: entry.timestamp,
            qualityScore: entry.trainingMetadata.qualityScore,
            userRating: entry.userFeedback.correctnessRating,
            aiAnalysis: entry.aiAnalysis
          }))
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalEntries: feedbackDatabase.length,
        validForTraining: feedbackDatabase.filter(e => e.trainingMetadata.isValidForTraining).length
      }
    });

  } catch (error) {
    console.error('Feedback retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback data' },
      { status: 500 }
    );
  }
}

function calculateImageQuality(base64Image: string, aiConfidence: number): number {
  // Simple quality assessment based on image size and AI confidence
  // In production, this would include more sophisticated image analysis
  const imageSize = base64Image.length;
  const sizeScore = Math.min(imageSize / 100000, 1); // Normalize based on expected size
  const confidenceScore = aiConfidence;

  return (sizeScore * 0.3 + confidenceScore * 0.7);
}

function updateFeedbackStats(entry: FeedbackEntry) {
  feedbackStats.totalSubmissions++;

  // Update average rating
  const totalRating = feedbackDatabase.reduce((sum, e) => sum + e.userFeedback.correctnessRating, 0);
  feedbackStats.averageRating = totalRating / feedbackDatabase.length;

  // Update common issues
  entry.userFeedback.reportedIssues.forEach(issue => {
    if (!feedbackStats.commonIssues.includes(issue)) {
      feedbackStats.commonIssues.push(issue);
    }
  });

  // Keep only top 10 common issues
  feedbackStats.commonIssues = feedbackStats.commonIssues.slice(0, 10);
}

async function queueForExpertReview(entry: FeedbackEntry): Promise<void> {
  // In production, this would integrate with a review system
  console.log(`Queued feedback ${entry.id} for expert review - Quality Score: ${entry.trainingMetadata.qualityScore}`);

  // Could send notification to expert reviewers
  // Could integrate with annotation tools
  // Could trigger automated pre-processing
}
