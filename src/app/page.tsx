'use client';

import { useState } from 'react';
import QRScanner from '@/components/QRScanner';
import LanguageSelector from '@/components/LanguageSelector';
import ProductSearch from '@/components/ProductSearch';
import { useTranslation } from '@/lib/translations';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<'scan' | 'language' | 'manual'>('scan');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const { t } = useTranslation(selectedLanguage);

  const handleProductScanned = (product: any) => {
    setSelectedProduct(product);
    setCurrentStep('language');
  };

  const handleLanguageSelected = (language: string) => {
    setSelectedLanguage(language);
    setCurrentStep('manual');
    // Redirect to manual page
    window.location.href = `/manual/${selectedProduct.id}?lang=${language}`;
  };

  const handleManualSearch = (product: any) => {
    setSelectedProduct(product);
    setCurrentStep('language');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dehn-primary to-dehn-secondary">
      {/* Mobile Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-dehn-primary font-bold text-sm">D</span>
              </div>
              <h1 className="text-white font-semibold text-lg">DEHN Manual</h1>
            </div>
            <button className="text-white/80 hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {currentStep === 'scan' && (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="text-center text-white space-y-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h.01" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">{t('welcome')}</h2>
              <p className="text-white/80 text-lg">
                {t('welcomeDescription')}
              </p>
            </div>

            {/* QR Scanner Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-dehn-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('scanQRCode')}</h3>
                <p className="text-gray-600">{t('scanDescription')}</p>
              </div>
              <QRScanner onProductScanned={handleProductScanned} />
            </div>

            {/* Demo Section */}
            <div className="bg-yellow-400 rounded-2xl p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('tryDemo')}</h3>
              <p className="text-gray-800 mb-4">{t('demoDescription')}</p>
              <div className="space-y-3">
                <a
                  href="/demo"
                  className="inline-flex items-center bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold w-full justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Try AI Features Demo
                </a>
                <a
                  href="/demo-qr.html"
                  target="_blank"
                  className="inline-flex items-center bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold w-full justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h.01" />
                  </svg>
                  {t('openDemoQR')}
                </a>
              </div>
            </div>

            {/* Alternative Search */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-center mb-4">
                <h3 className="text-white font-semibold text-lg mb-2">{t('cantScan')}</h3>
                <p className="text-white/80 text-sm">{t('searchManually')}</p>
              </div>
              <ProductSearch onProductSelected={handleManualSearch} />
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold text-sm mb-1">{t('aiAssistant')}</h4>
                <p className="text-white/70 text-xs">{t('aiAssistantDesc')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold text-sm mb-1">{t('videoGuides')}</h4>
                <p className="text-white/70 text-xs">{t('videoGuidesDesc')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold text-sm mb-1">{t('photoVerify')}</h4>
                <p className="text-white/70 text-xs">{t('photoVerifyDesc')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold text-sm mb-1">{t('multiLanguage')}</h4>
                <p className="text-white/70 text-xs">{t('multiLanguageDesc')}</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'language' && selectedProduct && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-center space-x-2 mb-8">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="w-12 h-1 bg-green-500 rounded"></div>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-dehn-primary">
                <span className="text-dehn-primary font-bold text-sm">2</span>
              </div>
              <div className="w-12 h-1 bg-white/30 rounded"></div>
              <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">3</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('chooseLanguage')}</h2>
                <p className="text-gray-600">{t('selectLanguage')}</p>
              </div>
              <LanguageSelector
                onLanguageSelected={handleLanguageSelected}
                productName={selectedProduct.name}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
