'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/translations';

interface VoiceAssistantProps {
  productId: string;
  language: string;
  onResponse?: (response: string) => void;
}

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
}

export default function VoiceAssistant({ productId, language, onResponse }: VoiceAssistantProps) {
  const { t } = useTranslation(language);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    transcript: '',
    error: null
  });

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = getLanguageCode(language);

        recognitionRef.current.onstart = () => {
          setVoiceState(prev => ({ ...prev, isListening: true, error: null }));
        };

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');

          setVoiceState(prev => ({ ...prev, transcript }));

          if (event.results[event.results.length - 1].isFinal) {
            handleVoiceQuery(transcript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          setVoiceState(prev => ({
            ...prev,
            isListening: false,
            error: `Voice recognition error: ${event.error}`
          }));
        };

        recognitionRef.current.onend = () => {
          setVoiceState(prev => ({ ...prev, isListening: false }));
        };
      }
    }

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [language]);

  const getLanguageCode = (lang: string): string => {
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'de': 'de-DE',
      'fr': 'fr-FR',
      'it': 'it-IT',
      'es': 'es-ES',
      'zh': 'zh-CN'
    };
    return langMap[lang] || 'en-US';
  };

  const startListening = () => {
    if (recognitionRef.current && !voiceState.isListening) {
      setVoiceState(prev => ({ ...prev, transcript: '', error: null }));
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && voiceState.isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleVoiceQuery = async (query: string) => {
    if (!query.trim()) return;

    setVoiceState(prev => ({
      ...prev,
      isListening: false,
      isProcessing: true
    }));

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          productId,
          language
        }),
      });

      const data = await response.json();

      if (data.success) {
        const answer = data.data.answer;
        onResponse?.(answer);
        speakResponse(answer);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Voice query error:', error);
      setVoiceState(prev => ({
        ...prev,
        error: 'Failed to process voice query'
      }));
    } finally {
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const speakResponse = (text: string) => {
    if (synthRef.current && text) {
      // Cancel any ongoing speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguageCode(language);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      utterance.onstart = () => {
        setVoiceState(prev => ({ ...prev, isSpeaking: true }));
      };

      utterance.onend = () => {
        setVoiceState(prev => ({ ...prev, isSpeaking: false }));
      };

      utterance.onerror = () => {
        setVoiceState(prev => ({ ...prev, isSpeaking: false }));
      };

      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setVoiceState(prev => ({ ...prev, isSpeaking: false }));
    }
  };

  const isSupported = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) &&
    'speechSynthesis' in window;

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-yellow-800 text-sm">
            Voice assistant not supported in this browser. Please use Chrome, Safari, or Edge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Voice Assistant
        </h3>

        {voiceState.isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium"
          >
            Stop Speaking
          </button>
        )}
      </div>

      {/* Voice Status Display */}
      <div className="mb-4">
        {voiceState.isListening && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-blue-800 text-sm font-medium">Listening...</span>
            </div>
            {voiceState.transcript && (
              <p className="text-blue-700 text-sm mt-2 italic">"{voiceState.transcript}"</p>
            )}
          </div>
        )}

        {voiceState.isProcessing && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full mr-2"></div>
              <span className="text-yellow-800 text-sm font-medium">Processing your question...</span>
            </div>
          </div>
        )}

        {voiceState.isSpeaking && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-600 mr-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.586 17.414L12 14H7a1 1 0 01-1-1V9a1 1 0 011-1h5l3.414-3.414A1 1 0 0117 5.586v12.828a1 1 0 01-1.707.707z" />
              </svg>
              <span className="text-green-800 text-sm font-medium">Speaking response...</span>
            </div>
          </div>
        )}

        {voiceState.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 text-sm">{voiceState.error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Voice Control Button */}
      <div className="text-center">
        {!voiceState.isListening ? (
          <button
            onClick={startListening}
            disabled={voiceState.isProcessing || voiceState.isSpeaking}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center mx-auto transition-all duration-200 transform hover:scale-105 disabled:transform-none"
          >
            <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Ask Question
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center mx-auto transition-all duration-200"
          >
            <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
            </svg>
            Stop Listening
          </button>
        )}
      </div>

      {/* Quick Voice Commands */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Voice Commands:</h4>
        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
            "What tools do I need?"
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
            "How do I connect the wires?"
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
            "What are the safety requirements?"
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
            "Show me the wiring diagram"
          </div>
        </div>
      </div>
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
