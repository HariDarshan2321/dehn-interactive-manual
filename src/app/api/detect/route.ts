import { NextRequest, NextResponse } from 'next/server';
import { multimodalRAG } from '@/lib/ai/multimodal-rag';
import { objectDetectionService } from '@/lib/ai/object-detection';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const productId = formData.get('productId') as string;
    const stepNumber = parseInt(formData.get('stepNumber') as string);

    if (!image || !productId || !stepNumber) {
      return NextResponse.json(
        { error: 'Image, productId, and stepNumber are required' },
        { status: 400 }
      );
    }

    // Convert image to base64 for processing
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Get expected components for this step
    const installationSteps = objectDetectionService.getInstallationSteps(productId);
    const currentStep = installationSteps.find(step => step.stepNumber === stepNumber);
    const expectedComponents = currentStep?.expectedComponents || [];

    // Use multimodal RAG for advanced object detection
    const detectionResult = await multimodalRAG.detectObjectsInImage(
      base64Image,
      expectedComponents
    );

    // Generate overlay data for frontend
    const overlayData = objectDetectionService.generateOverlayData({
      status: detectionResult.overallStatus,
      confidence: detectionResult.detectedComponents.reduce((sum, comp) => sum + comp.confidence, 0) / detectionResult.detectedComponents.length || 0,
      components: detectionResult.detectedComponents.map(comp => ({
        name: comp.name,
        detected: comp.status !== 'missing',
        correct: comp.status === 'correct',
        confidence: comp.confidence,
        position: comp.boundingBox,
        issue: comp.issues?.join(', ')
      })),
      issues: detectionResult.detectedComponents.filter(comp => comp.status !== 'correct').map(comp => comp.issues?.join(', ') || `${comp.name} needs attention`),
      suggestions: detectionResult.suggestions
    });

    return NextResponse.json({
      success: true,
      data: {
        ...detectionResult,
        overlays: overlayData.overlays,
        productId,
        stepNumber,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Object detection error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze installation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'ProductId is required' },
        { status: 400 }
      );
    }

    // Get installation steps for the product
    const steps = objectDetectionService.getInstallationSteps(productId);

    return NextResponse.json({
      success: true,
      data: {
        productId,
        steps,
        totalSteps: steps.length
      }
    });

  } catch (error) {
    console.error('Get installation steps error:', error);
    return NextResponse.json(
      { error: 'Failed to get installation steps' },
      { status: 500 }
    );
  }
}
