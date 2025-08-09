export interface DetectionResult {
  status: 'complete' | 'incomplete' | 'error';
  confidence: number;
  components: ComponentDetection[];
  issues: string[];
  suggestions: string[];
}

export interface ComponentDetection {
  name: string;
  detected: boolean;
  correct: boolean;
  confidence: number;
  position?: { x: number; y: number; width: number; height: number };
  issue?: string;
}

export interface InstallationStep {
  stepNumber: number;
  description: string;
  expectedComponents: string[];
  safetyChecks: string[];
}

export class ObjectDetectionService {
  private static instance: ObjectDetectionService;
  private mockDetectionData: Map<string, DetectionResult> = new Map();

  static getInstance(): ObjectDetectionService {
    if (!ObjectDetectionService.instance) {
      ObjectDetectionService.instance = new ObjectDetectionService();
    }
    return ObjectDetectionService.instance;
  }

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock detection results for demo purposes
    this.mockDetectionData.set('surge_protector_step1', {
      status: 'incomplete',
      confidence: 0.87,
      components: [
        {
          name: 'ground_wire',
          detected: true,
          correct: true,
          confidence: 0.95,
          position: { x: 120, y: 80, width: 40, height: 20 }
        },
        {
          name: 'live_wire',
          detected: true,
          correct: false,
          confidence: 0.82,
          position: { x: 180, y: 100, width: 40, height: 20 },
          issue: 'Connected to wrong terminal'
        },
        {
          name: 'neutral_wire',
          detected: false,
          correct: false,
          confidence: 0.0,
          issue: 'Not connected'
        }
      ],
      issues: [
        'Red wire connected to N terminal instead of L terminal',
        'Neutral wire not connected'
      ],
      suggestions: [
        'Move red wire from N terminal to L terminal',
        'Connect blue wire to N terminal',
        'Ensure all connections are tight (2.5 Nm torque)'
      ]
    });

    this.mockDetectionData.set('surge_protector_step2', {
      status: 'complete',
      confidence: 0.94,
      components: [
        {
          name: 'ground_wire',
          detected: true,
          correct: true,
          confidence: 0.96
        },
        {
          name: 'live_wire',
          detected: true,
          correct: true,
          confidence: 0.93
        },
        {
          name: 'neutral_wire',
          detected: true,
          correct: true,
          confidence: 0.91
        }
      ],
      issues: [],
      suggestions: [
        'Installation appears correct',
        'Proceed to testing phase'
      ]
    });
  }

  async analyzeInstallation(
    imageData: string | File,
    productId: string,
    stepNumber: number
  ): Promise<DetectionResult> {
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For demo purposes, return mock data based on product and step
      const mockKey = `${productId}_step${stepNumber}`;
      const mockResult = this.mockDetectionData.get(mockKey);

      if (mockResult) {
        return mockResult;
      }

      // Default result for unknown combinations
      return this.generateDefaultResult(productId, stepNumber);
    } catch (error) {
      console.error('Object detection error:', error);
      return {
        status: 'error',
        confidence: 0,
        components: [],
        issues: ['Unable to analyze image. Please try again.'],
        suggestions: ['Ensure good lighting and clear view of components']
      };
    }
  }

  private generateDefaultResult(productId: string, stepNumber: number): DetectionResult {
    // Generate a realistic default result
    const components: ComponentDetection[] = [
      {
        name: 'main_component',
        detected: true,
        correct: Math.random() > 0.3,
        confidence: 0.7 + Math.random() * 0.2
      },
      {
        name: 'connection_point',
        detected: Math.random() > 0.2,
        correct: Math.random() > 0.4,
        confidence: 0.6 + Math.random() * 0.3
      }
    ];

    const allCorrect = components.every(c => c.correct && c.detected);
    const confidence = components.reduce((sum, c) => sum + c.confidence, 0) / components.length;

    return {
      status: allCorrect ? 'complete' : 'incomplete',
      confidence,
      components,
      issues: allCorrect ? [] : ['Some components need attention'],
      suggestions: allCorrect ? 
        ['Installation looks good', 'Proceed to next step'] : 
        ['Check component placement', 'Refer to manual for correct positioning']
    };
  }

  // Method to get installation steps for a product
  getInstallationSteps(productId: string): InstallationStep[] {
    // Mock installation steps - in real implementation, this would come from the manual
    const steps: InstallationStep[] = [
      {
        stepNumber: 1,
        description: 'Connect ground wire to earth terminal',
        expectedComponents: ['ground_wire', 'earth_terminal'],
        safetyChecks: ['Ensure power is off', 'Use proper PPE']
      },
      {
        stepNumber: 2,
        description: 'Connect live and neutral wires',
        expectedComponents: ['live_wire', 'neutral_wire', 'L_terminal', 'N_terminal'],
        safetyChecks: ['Verify wire colors', 'Check terminal markings']
      },
      {
        stepNumber: 3,
        description: 'Secure all connections',
        expectedComponents: ['terminal_screws', 'wire_connections'],
        safetyChecks: ['Apply correct torque (2.5 Nm)', 'Verify no loose connections']
      },
      {
        stepNumber: 4,
        description: 'Final inspection and testing',
        expectedComponents: ['complete_installation'],
        safetyChecks: ['Visual inspection', 'Continuity test', 'Insulation test']
      }
    ];

    return steps;
  }

  // Method to validate installation completeness
  validateInstallationComplete(productId: string, allResults: DetectionResult[]): {
    isComplete: boolean;
    overallConfidence: number;
    remainingIssues: string[];
    nextSteps: string[];
  } {
    const allComplete = allResults.every(result => result.status === 'complete');
    const overallConfidence = allResults.reduce((sum, result) => sum + result.confidence, 0) / allResults.length;
    
    const remainingIssues = allResults
      .filter(result => result.status !== 'complete')
      .flatMap(result => result.issues);

    const nextSteps = allComplete ? 
      ['Installation complete', 'Perform final testing', 'Document installation'] :
      ['Address remaining issues', 'Re-verify problematic steps', 'Consult manual if needed'];

    return {
      isComplete: allComplete,
      overallConfidence,
      remainingIssues,
      nextSteps
    };
  }

  // Method to generate visual overlay data for frontend
  generateOverlayData(result: DetectionResult): {
    overlays: Array<{
      type: 'success' | 'warning' | 'error';
      position: { x: number; y: number; width: number; height: number };
      message: string;
    }>;
  } {
    const overlays = result.components
      .filter(component => component.position)
      .map(component => ({
        type: component.correct ? 'success' as const : 'error' as const,
        position: component.position!,
        message: component.correct ? 
          `✓ ${component.name} correct` : 
          `✗ ${component.name}: ${component.issue || 'Incorrect placement'}`
      }));

    return { overlays };
  }
}

export const objectDetectionService = ObjectDetectionService.getInstance();
