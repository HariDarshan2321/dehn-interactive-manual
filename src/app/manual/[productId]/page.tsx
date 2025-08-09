'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/translations';
import VoiceAssistant from '@/components/VoiceAssistant';

export default function ManualPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params?.productId as string;
  const lang = searchParams?.get('lang') || 'en';

  const [product, setProduct] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [installationMode, setInstallationMode] = useState<'full' | 'partial' | null>(null);
  const [aiResponse, setAiResponse] = useState<string>('');
  const { t } = useTranslation(lang);

  useEffect(() => {
    const mockProduct = {
      id: productId,
      name: 'DEHNbloc Maxi DBM 1 CI 760 FM',
      category: 'Surge Protection Device',
      image: '/images/dehn-product.jpg',
      warnings: t('warningText'),
      estimatedTime: '45 minutes',
      difficulty: 'Medium',
      steps: [
        {
          id: 1,
          title: t('steps.safetyPreparation.title'),
          description: t('steps.safetyPreparation.description'),
          details: t('steps.safetyPreparation.details'),
          duration: '5 min',
          tools: t('steps.safetyPreparation.tools'),
          safetyNotes: t('steps.safetyPreparation.safetyNotes'),
          image: '/images/step1.jpg',
          videoUrl: '/videos/step1.mp4'
        },
        {
          id: 2,
          title: t('steps.mountDINRail.title'),
          description: t('steps.mountDINRail.description'),
          details: t('steps.mountDINRail.details'),
          duration: '10 min',
          tools: t('steps.mountDINRail.tools'),
          safetyNotes: t('steps.mountDINRail.safetyNotes'),
          image: '/images/step2.jpg',
          videoUrl: '/videos/step2.mp4'
        },
        {
          id: 3,
          title: t('steps.wireConnections.title'),
          description: t('steps.wireConnections.description'),
          details: t('steps.wireConnections.details'),
          duration: '20 min',
          tools: t('steps.wireConnections.tools'),
          safetyNotes: t('steps.wireConnections.safetyNotes'),
          image: '/images/step3.jpg',
          videoUrl: '/videos/step3.mp4'
        },
        {
          id: 4,
          title: t('steps.finalTesting.title'),
          description: t('steps.finalTesting.description'),
          details: t('steps.finalTesting.details'),
          duration: '10 min',
          tools: t('steps.finalTesting.tools'),
          safetyNotes: t('steps.finalTesting.safetyNotes'),
          image: '/images/step4.jpg',
          videoUrl: '/videos/step4.mp4'
        }
      ]
    };
    setProduct(mockProduct);
  }, [productId]);

  const handleStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    if (stepId < product.steps.length) {
      setCurrentStep(stepId);
    }
  };

  const handlePhotoVerification = () => {
    setShowCamera(true);
    // Mock photo verification
    setTimeout(() => {
      setShowCamera(false);
      alert(t('installationVerified'));
      handleStepComplete(currentStep + 1);
    }, 3000);
  };

  const progress = (completedSteps.length / product?.steps.length) * 100;

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dehn-primary to-dehn-secondary flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading installation guide...</p>
        </div>
      </div>
    );
  }

  if (!installationMode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dehn-primary to-dehn-secondary">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => window.history.back()}
                className="text-white/80 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-white font-semibold text-lg">{t('installationGuide')}</h1>
              <button className="text-white/80 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 space-y-6">
          {/* Product Info */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-dehn-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 9.34c-.665-.995-1.824-2.34-3-2.34s-2.335 1.345-3 2.34M12 3a9 9 0 11-9 9 9 9 0 019-9z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>
              <p className="text-gray-600 mb-4">{product.category}</p>

              <div className="flex justify-center space-x-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {product.estimatedTime}
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {product.difficulty}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-yellow-800 text-sm">{product.warnings}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setInstallationMode('full')}
                className="w-full bg-gradient-to-r from-dehn-primary to-blue-600 text-white py-5 px-6 rounded-2xl font-bold text-lg flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <svg className="w-7 h-7 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Complete Installation Guide
              </button>

              <button
                onClick={() => setInstallationMode('partial')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-5 px-6 rounded-2xl font-bold text-lg flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <svg className="w-7 h-7 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                I just need partial help
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">{t('quickLinks')}</h3>
              <div className="flex space-x-3">
                <button className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg font-medium">
                  {t('youtube')}
                </button>
                <button className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium">
                  {t('pdfManual')}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header with Progress */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setInstallationMode(null)}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-semibold text-gray-900">{t('stepOf', { current: currentStep + 1, total: product.steps.length })}</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowVoiceAssistant(true)}
                className="bg-purple-600 text-white p-2 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button
                onClick={() => setShowAIAgent(true)}
                className="bg-dehn-primary text-white p-2 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-dehn-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{t('progress')}</span>
            <span>{Math.round(progress)}{t('complete')}</span>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        {/* Current Step */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-dehn-primary rounded-xl flex items-center justify-center mr-4">
              <span className="text-white font-bold text-lg">{currentStep + 1}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{product.steps[currentStep].title}</h2>
              <p className="text-gray-600">{product.steps[currentStep].duration}</p>
            </div>
          </div>

          <p className="text-gray-700 mb-4">{product.steps[currentStep].description}</p>

          {/* Step Image/Video */}
          <div className="w-full h-48 bg-gray-200 rounded-xl mb-4 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Installation Video</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <h4 className="font-semibold text-blue-900 mb-2">{t('detailedInstructions')}</h4>
            <p className="text-blue-800 text-sm">{product.steps[currentStep].details}</p>
          </div>

          {/* Tools Required */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">{t('toolsRequired')}</h4>
            <div className="flex flex-wrap gap-2">
              {product.steps[currentStep].tools.map((tool: string, index: number) => (
                <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Safety Note */}
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-800 text-sm font-medium">{product.steps[currentStep].safetyNotes}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Show photo verification only after all steps are completed */}
            {completedSteps.length === product.steps.length ? (
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-6 text-center text-white mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">🎉 Installation Complete!</h3>
                <p className="text-white/90 mb-4">Great job! Now let's verify your installation with AI photo analysis.</p>
                <button
                  onClick={handlePhotoVerification}
                  className="bg-white text-green-600 py-4 px-8 rounded-xl font-bold text-lg flex items-center justify-center mx-auto shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Verify Installation with AI
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-4 rounded-xl font-semibold flex items-center justify-center shadow-md transform hover:scale-105 transition-all duration-200">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Watch Video
                  </button>
                  <button
                    onClick={() => setShowAIAgent(true)}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 px-4 rounded-xl font-semibold flex items-center justify-center shadow-md transform hover:scale-105 transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ask AI
                  </button>
                </div>

                {currentStep < product.steps.length - 1 ? (
                  <button
                    onClick={() => handleStepComplete(currentStep + 1)}
                    className="w-full bg-gradient-to-r from-dehn-primary to-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    ✓ Mark Step Complete & Continue
                  </button>
                ) : (
                  <button
                    onClick={() => handleStepComplete(currentStep + 1)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    🎯 Complete Final Step
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Step Navigation */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">{t('allSteps')}</h3>
          <div className="space-y-2">
            {product.steps.map((step: any, index: number) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  completedSteps.includes(step.id)
                    ? 'bg-green-50 border-2 border-green-200'
                    : currentStep === index
                    ? 'bg-dehn-primary bg-opacity-10 border-2 border-dehn-primary'
                    : 'bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    completedSteps.includes(step.id)
                      ? 'bg-green-500 text-white'
                      : currentStep === index
                      ? 'bg-dehn-primary text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {completedSteps.includes(step.id) ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.duration}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Voice Assistant Modal */}
      {showVoiceAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Voice Assistant</h3>
                <button
                  onClick={() => setShowVoiceAssistant(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <VoiceAssistant
                productId={productId}
                language={lang}
                onResponse={(response) => {
                  setAiResponse(response);
                  setShowVoiceAssistant(false);
                  setShowAIAgent(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Agent Modal */}
      {showAIAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('aiAssistantTitle')}</h3>
                <button
                  onClick={() => setShowAIAgent(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 h-96 overflow-y-auto">
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-blue-900">{t('aiGreeting', { productName: product.name })}</p>
                </div>

                {aiResponse && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 mb-2">AI Response:</h4>
                    <p className="text-green-800 text-sm">{aiResponse}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-gray-100 p-3 rounded-xl text-sm text-left">
                    {t('whatTools')}
                  </button>
                  <button className="bg-gray-100 p-3 rounded-xl text-sm text-left">
                    {t('safetyPrecautions')}
                  </button>
                  <button className="bg-gray-100 p-3 rounded-xl text-sm text-left">
                    {t('wireSpecs')}
                  </button>
                  <button className="bg-gray-100 p-3 rounded-xl text-sm text-left">
                    {t('troubleshooting')}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder={t('askAnything')}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
                />
                <button className="bg-dehn-primary text-white px-6 py-3 rounded-xl">
                  {t('send')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 m-4 text-center">
            <div className="w-64 h-48 bg-gray-200 rounded-xl mb-4 flex items-center justify-center">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>{t('analyzingInstallation')}</p>
              </div>
            </div>
            <p className="text-gray-600">{t('aiVerifying')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
