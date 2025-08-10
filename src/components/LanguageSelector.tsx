'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/translations';

interface LanguageSelectorProps {
  onLanguageSelected: (language: string) => void;
  productName: string;
}

const LANGUAGES = [
  {
    code: 'de',
    name: 'Deutsch',
    flag: '🇩🇪',
    nativeName: 'Deutsch'
  },
  {
    code: 'en',
    name: 'English',
    flag: '🇬🇧',
    nativeName: 'English'
  },
  {
    code: 'it',
    name: 'Italian',
    flag: '🇮🇹',
    nativeName: 'Italiano'
  },
  {
    code: 'fr',
    name: 'French',
    flag: '🇫🇷',
    nativeName: 'Français'
  },
  {
    code: 'es',
    name: 'Spanish',
    flag: '🇪🇸',
    nativeName: 'Español'
  },
  {
    code: 'zh',
    name: 'Chinese',
    flag: '🇨🇳',
    nativeName: '中文'
  }
];

export default function LanguageSelector({ onLanguageSelected, productName }: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const { t } = useTranslation(selectedLanguage || 'en');

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  const handleConfirm = () => {
    if (selectedLanguage) {
      onLanguageSelected(selectedLanguage);
    }
  };

  const playVoicePreview = async (languageCode: string) => {
    setIsPlaying(languageCode);

    // Mock voice preview - in real implementation, this would use TTS
    const sampleText = {
      de: "Willkommen zur interaktiven Anleitung",
      en: "Welcome to the interactive manual",
      it: "Benvenuti al manuale interattivo",
      fr: "Bienvenue dans le manuel interactif",
      es: "Bienvenido al manual interactivo",
      zh: "欢迎使用交互式手册"
    };

    try {
      // Use Web Speech API for voice preview
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(sampleText[languageCode as keyof typeof sampleText]);
        utterance.lang = languageCode === 'zh' ? 'zh-CN' : languageCode;
        utterance.rate = 0.9;
        utterance.onend = () => setIsPlaying(null);
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Voice preview error:', error);
      setIsPlaying(null);
    }

    // Fallback timeout
    setTimeout(() => setIsPlaying(null), 3000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('chooseLanguage')}
          </h3>
          <p className="text-gray-600">
            {t('selectLanguage')}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200 touch-target bg-white
                  ${selectedLanguage === language.code
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                  }
                `}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{language.flag}</div>
                  <div className="font-semibold text-gray-900 mb-1">
                    {language.nativeName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {language.name}
                  </div>
                </div>

                {selectedLanguage === language.code && (
                  <div className="absolute top-2 right-2">
                    <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedLanguage && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">
                  {LANGUAGES.find(l => l.code === selectedLanguage)?.flag}
                </span>
                <div>
                  <div className="font-semibold text-gray-900">
                    {LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('instructionsInLanguage')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => playVoicePreview(selectedLanguage)}
                disabled={isPlaying === selectedLanguage}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center"
              >
                {isPlaying === selectedLanguage ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('playing')}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.586 17.414L12 14H7a1 1 0 01-1-1V9a1 1 0 011-1h5l3.414-3.414A1 1 0 0117 5.586v12.828a1 1 0 01-1.707.707z" />
                    </svg>
                    {t('preview')}
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleConfirm}
              className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-semibold w-full transition-colors"
            >
              {t('continueWith')} {LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName}
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {t('languageChangeNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
