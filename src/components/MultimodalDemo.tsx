'use client';

import { useState } from 'react';

interface MultimodalDemoProps {
  productId: string;
  productName: string;
}

export default function MultimodalDemo({ productId, productName }: MultimodalDemoProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'detect' | 'manual'>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [detectionResults, setDetectionResults] = useState<any>(null);

  const handleComponentSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          productId,
          componentType: 'electrical'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSearchResults(result.data.components || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleObjectDetection = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('productId', productId);
      formData.append('stepNumber', '1');

      const response = await fetch('/api/detect', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setDetectionResults(result.data);
      }
    } catch (error) {
      console.error('Detection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const demoQueries = [
    "Where is the ground terminal located?",
    "How do I connect the live wire?",
    "What is the correct torque specification?",
    "Show me the safety warnings for this component"
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dehn-primary mb-2">
          DEHN Multimodal AI Assistant
        </h1>
        <p className="text-gray-600">
          Advanced AI-powered manual interaction for {productName}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {[
          { id: 'search', label: 'Component Search', icon: '🔍' },
          { id: 'detect', label: 'Object Detection', icon: '📷' },
          { id: 'manual', label: 'Interactive Manual', icon: '📖' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-dehn-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Component Search Tab */}
      {activeTab === 'search' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">AI Component Search</h2>
          <p className="text-gray-600 mb-6">
            Ask questions about specific components and get answers with visual references from the manual.
          </p>

          <div className="space-y-4">
            <div className="flex space-x-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about any component (e.g., 'Where is the ground terminal?')"
                className="input-field flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleComponentSearch()}
              />
              <button
                onClick={handleComponentSearch}
                disabled={isLoading || !query.trim()}
                className="btn-primary"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Demo Queries */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Try these example queries:</p>
              <div className="flex flex-wrap gap-2">
                {demoQueries.map((demoQuery, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(demoQuery)}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100"
                  >
                    {demoQuery}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Search Results:</h3>
                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium text-dehn-primary mb-2">
                        {result.component}
                      </h4>
                      <p className="text-gray-700 mb-2">{result.instructions}</p>

                      {result.safetyWarnings?.length > 0 && (
                        <div className="safety-warning mb-2">
                          <strong>⚠️ Safety Warnings:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {result.safetyWarnings.map((warning: string, i: number) => (
                              <li key={i} className="text-red-700">{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Location: {result.location}</span>
                        <span>Confidence: {Math.round(result.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Object Detection Tab */}
      {activeTab === 'detect' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">AI Object Detection</h2>
          <p className="text-gray-600 mb-6">
            Upload a photo of your installation and get AI-powered verification and feedback.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Installation Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="input-field"
              />
            </div>

            {selectedImage && (
              <div>
                <h3 className="font-medium mb-2">Selected Image:</h3>
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Selected installation"
                  className="max-w-md rounded-lg border"
                />
                <button
                  onClick={handleObjectDetection}
                  disabled={isLoading}
                  className="btn-primary mt-4"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Installation'}
                </button>
              </div>
            )}

            {/* Detection Results */}
            {detectionResults && (
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Detection Results:</h3>

                <div className={`p-4 rounded-lg mb-4 ${
                  detectionResults.overallStatus === 'complete'
                    ? 'bg-green-50 border border-green-200'
                    : detectionResults.overallStatus === 'incomplete'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <h4 className="font-medium mb-2">
                    Overall Status: {detectionResults.overallStatus.toUpperCase()}
                  </h4>

                  {detectionResults.detectedComponents?.map((component: any, index: number) => (
                    <div key={index} className="mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        component.status === 'correct'
                          ? 'bg-green-100 text-green-800'
                          : component.status === 'incorrect'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {component.name}: {component.status}
                      </span>
                      {component.issues && (
                        <span className="ml-2 text-sm text-red-600">
                          {component.issues.join(', ')}
                        </span>
                      )}
                    </div>
                  ))}

                  {detectionResults.suggestions?.length > 0 && (
                    <div className="mt-4">
                      <strong>Suggestions:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {detectionResults.suggestions.map((suggestion: string, i: number) => (
                          <li key={i} className="text-sm">{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Manual Tab */}
      {activeTab === 'manual' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Interactive Manual</h2>
          <p className="text-gray-600 mb-6">
            Browse the complete manual with AI-enhanced search and visual component identification.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-4">Manual Sections</h3>
              <div className="space-y-2">
                {[
                  { title: 'Safety Instructions', pages: '1-3', icon: '⚠️' },
                  { title: 'Installation Guide', pages: '4-8', icon: '🔧' },
                  { title: 'Wiring Diagrams', pages: '9-12', icon: '⚡' },
                  { title: 'Testing Procedures', pages: '13-15', icon: '🧪' },
                  { title: 'Troubleshooting', pages: '16-18', icon: '🔍' }
                ].map((section, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-3">{section.icon}</span>
                        <span className="font-medium">{section.title}</span>
                      </div>
                      <span className="text-sm text-gray-500">Pages {section.pages}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full btn-primary">
                  🎥 Watch Installation Video
                </button>
                <button className="w-full btn-secondary">
                  📋 Download Checklist
                </button>
                <button className="w-full btn-secondary">
                  📞 Contact Expert
                </button>
                <button className="w-full btn-secondary">
                  🌐 View in Other Languages
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Powered by OpenAI GPT-4 Vision • Multimodal RAG • DEHN Technical Documentation
        </p>
      </div>
    </div>
  );
}
