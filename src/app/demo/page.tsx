'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/translations';
import VoiceAssistant from '@/components/VoiceAssistant';
import MultimodalDemo from '@/components/MultimodalDemo';

export default function DemoPage() {
  const searchParams = useSearchParams();
  const lang = searchParams?.get('lang') || 'en';
  const { t } = useTranslation(lang);

  const [activeDemo, setActiveDemo] = useState<'overview' | 'voice' | 'multimodal' | 'object-detection'>('overview');
  const [demoProduct] = useState('surge_protector');
  const [voiceResponse, setVoiceResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const demoFeatures = [
    {
      id: 'voice',
      title: 'Voice Assistant',
      description: 'Ask questions about installation using natural speech',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      color: 'bg-purple-500',
      features: [
        'Natural language processing',
        'Multi-language support',
        'Speech-to-text and text-to-speech',
        'Context-aware responses'
      ]
    },
    {
      id: 'multimodal',
      title: 'AI Search & Analysis',
      description: 'Search through manuals with text and image understanding',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: 'bg-blue-500',
      features: [
        'Semantic search across PDFs',
        'Image and text analysis',
        'Component identification',
        'Safety warning extraction'
      ]
    },
    {
      id: 'object-detection',
      title: 'Installation Verification',
      description: 'AI-powered photo analysis for installation verification',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'bg-green-500',
      features: [
        'GPT-4 Vision integration',
        'Component detection',
        'Installation validation',
        'Real-time feedback'
      ]
    }
  ];

  const handleVoiceResponse = (response: string) => {
    setVoiceResponse(response);
  };

  const simulateAIDemo = async (type: string) => {
    setIsLoading(true);

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    const responses = {
      voice: "I can help you with the DEHNbloc installation. The main steps are: 1) Turn off power, 2) Mount on DIN rail, 3) Connect wires (L, N, PE), 4) Test installation. Would you like details on any specific step?",
      search: "Found 3 relevant sections in the manual: Safety requirements (Page 2), Wiring diagram (Page 5), and Testing procedures (Page 8). The installation requires a 2.5mm² wire and 2.5 Nm torque for connections.",
      detection: "Installation analysis complete: ✓ Ground wire correctly connected, ✓ DIN rail mounting secure, ⚠️ Live wire needs adjustment - move from N to L terminal. Overall status: 85% complete."
    };

    setVoiceResponse(responses[type as keyof typeof responses] || "Demo response generated successfully!");
    setIsLoading(false);
  };

  if (activeDemo === 'voice') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveDemo('overview')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">Voice Assistant Demo</h1>
              <div className="w-6"></div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Voice Assistant</h2>
                <p className="text-gray-600">Ask questions about DEHN product installation using your voice</p>
              </div>

              <VoiceAssistant
                productId={demoProduct}
                language={lang}
                onResponse={handleVoiceResponse}
              />

              {voiceResponse && (
                <div className="mt-6 bg-green-50 rounded-xl p-4">
                  <h4 className="font-semibold text-green-900 mb-2">AI Response:</h4>
                  <p className="text-green-800">{voiceResponse}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Try These Voice Commands:</h3>
              <div className="grid gap-3">
                {[
                  "What tools do I need for installation?",
                  "How do I connect the ground wire?",
                  "What are the safety requirements?",
                  "Show me the wiring diagram",
                  "What's the torque specification?",
                  "How do I test the installation?"
                ].map((command, index) => (
                  <button
                    key={index}
                    onClick={() => simulateAIDemo('voice')}
                    disabled={isLoading}
                    className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-purple-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="text-gray-700">"{command}"</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (activeDemo === 'multimodal') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveDemo('overview')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">Multimodal AI Demo</h1>
              <div className="w-6"></div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6">
          <MultimodalDemo
            productId={demoProduct}
            productName="DEHNbloc Maxi DBM 1 CI 760 FM"
          />
        </main>
      </div>
    );
  }

  if (activeDemo === 'object-detection') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveDemo('overview')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">Object Detection Demo</h1>
              <div className="w-6"></div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Installation Verification</h2>
                <p className="text-gray-600">AI-powered photo analysis for installation verification</p>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-600 mb-4">Take a photo of your installation</p>
                  <button
                    onClick={() => simulateAIDemo('detection')}
                    disabled={isLoading}
                    className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
                  >
                    {isLoading ? 'Analyzing...' : 'Simulate Photo Analysis'}
                  </button>
                </div>

                {voiceResponse && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Analysis Results:</h4>
                    <p className="text-green-800">{voiceResponse}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What the AI Detects:</h3>
              <div className="grid gap-3">
                {[
                  { icon: '🔌', text: 'Wire connections and terminal placement' },
                  { icon: '⚡', text: 'Proper grounding and safety measures' },
                  { icon: '🔧', text: 'Component mounting and alignment' },
                  { icon: '📏', text: 'Torque specifications and tightness' },
                  { icon: '⚠️', text: 'Safety violations and corrections needed' },
                  { icon: '✅', text: 'Installation completeness verification' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl mr-3">{item.icon}</span>
                    <span className="text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dehn-primary to-dehn-secondary">
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
            <h1 className="text-white font-semibold text-lg">AI Features Demo</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">DEHN AI Assistant</h2>
          <p className="text-white/80">Experience the future of electrical installation guidance</p>
        </div>

        <div className="space-y-4">
          {demoFeatures.map((feature) => (
            <div key={feature.id} className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-start">
                <div className={`${feature.color} rounded-xl p-3 mr-4 flex-shrink-0`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>

                  <div className="grid grid-cols-1 gap-2 mb-4">
                    {feature.features.map((item, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveDemo(feature.id as any)}
                    className={`${feature.color} text-white px-6 py-3 rounded-xl font-semibold w-full`}
                  >
                    Try {feature.title}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-white font-semibold text-lg mb-4">🚀 Key Innovations</h3>
          <div className="grid gap-3">
            {[
              'Zero hallucination AI - Only uses verified manual content',
              'Product-specific embeddings for accurate responses',
              'GPT-4 Vision for real-time installation verification',
              'Multi-language voice assistant with speech synthesis',
              'Multimodal search across text and images',
              'Real-time safety warning detection'
            ].map((innovation, index) => (
              <div key={index} className="flex items-center text-white/90">
                <svg className="w-4 h-4 text-yellow-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {innovation}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Powered by OpenAI GPT-4, GPT-4 Vision, and advanced embedding technology
          </p>
        </div>
      </main>
    </div>
  );
}
