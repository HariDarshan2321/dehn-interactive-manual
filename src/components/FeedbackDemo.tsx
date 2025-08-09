'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, Star, AlertTriangle, CheckCircle, TrendingUp, Database, Brain } from 'lucide-react';

interface DetectedComponent {
  name: string;
  confidence: number;
  status: 'correct' | 'incorrect' | 'missing';
  issues?: string[];
}

interface AIAnalysis {
  detectedComponents: DetectedComponent[];
  overallStatus: 'complete' | 'incomplete' | 'error';
  confidence: number;
  suggestions: string[];
}

interface FeedbackStats {
  totalSubmissions: number;
  averageRating: number;
  validForTraining: number;
  pendingReview: number;
}

export default function FeedbackDemo() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [reportedIssues, setReportedIssues] = useState<string[]>([]);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'stats' | 'training'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setAiAnalysis(null);
      setSubmissionResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('productId', 'DEHNguard-M-TT');
      formData.append('stepNumber', '3');

      const response = await fetch('/api/detect', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setAiAnalysis(result.data);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitFeedback = async () => {
    if (!selectedImage || !aiAnalysis || userRating === 0) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('installationImage', selectedImage);
      formData.append('productId', 'DEHNguard-M-TT');
      formData.append('stepNumber', '3');
      formData.append('userRating', userRating.toString());
      formData.append('comments', comments);
      formData.append('reportedIssues', JSON.stringify(reportedIssues));

      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setSubmissionResult(result.data);
        // Reset form
        setSelectedImage(null);
        setImagePreview('');
        setAiAnalysis(null);
        setUserRating(0);
        setReportedIssues([]);
        setComments('');
        // Refresh stats
        loadFeedbackStats();
      }
    } catch (error) {
      console.error('Feedback submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadFeedbackStats = async () => {
    try {
      const response = await fetch('/api/feedback?type=stats');
      const result = await response.json();
      if (result.success) {
        setFeedbackStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const toggleIssue = (issue: string) => {
    setReportedIssues(prev =>
      prev.includes(issue)
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    );
  };

  React.useEffect(() => {
    loadFeedbackStats();
  }, []);

  const commonIssues = [
    'Component not detected',
    'Wrong component identified',
    'Installation position incorrect',
    'Safety warning missed',
    'Connection error not caught'
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">AI Training Feedback System</h1>
        <p className="text-blue-100">
          Help improve our object detection model by providing feedback on installation analysis
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'upload', label: 'Upload & Analyze', icon: Upload },
          { id: 'stats', label: 'Training Stats', icon: TrendingUp },
          { id: 'training', label: 'Dataset Info', icon: Database }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Upload & Analyze Tab */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Upload Installation Image
            </h2>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Selected installation"
                  className="max-w-full h-48 object-contain mx-auto rounded"
                />
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-gray-600">Click to upload installation photo</p>
                  <p className="text-sm text-gray-400">PNG, JPG up to 10MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {selectedImage && !aiAnalysis && (
              <button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Analyze with AI
                  </>
                )}
              </button>
            )}
          </div>

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">AI Analysis Results</h2>

              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${
                  aiAnalysis.overallStatus === 'complete' ? 'bg-green-50 border border-green-200' :
                  aiAnalysis.overallStatus === 'incomplete' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center">
                    {aiAnalysis.overallStatus === 'complete' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    )}
                    <span className="font-medium">
                      Status: {aiAnalysis.overallStatus.charAt(0).toUpperCase() + aiAnalysis.overallStatus.slice(1)}
                    </span>
                    <span className="ml-auto text-sm">
                      Confidence: {(aiAnalysis.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Detected Components:</h3>
                  <div className="space-y-2">
                    {aiAnalysis.detectedComponents.map((component, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>{component.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            component.status === 'correct' ? 'bg-green-100 text-green-800' :
                            component.status === 'incorrect' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {component.status}
                          </span>
                          <span className="text-sm text-gray-600">
                            {(component.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {aiAnalysis.suggestions.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">AI Suggestions:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {aiAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback Form */}
          {aiAnalysis && (
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Provide Feedback</h2>

              <div className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    How accurate was the AI analysis? *
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setUserRating(star)}
                        className={`p-1 ${
                          star <= userRating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Issues */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What issues did you notice? (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {commonIssues.map((issue) => (
                      <label key={issue} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={reportedIssues.includes(issue)}
                          onChange={() => toggleIssue(issue)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{issue}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional Comments
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Any additional feedback to help improve our AI..."
                  />
                </div>

                <button
                  onClick={submitFeedback}
                  disabled={isSubmitting || userRating === 0}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting Feedback...
                    </>
                  ) : (
                    'Submit Feedback & Contribute to Training'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Submission Result */}
          {submissionResult && (
            <div className="lg:col-span-2 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">Feedback Submitted Successfully!</span>
              </div>
              <div className="mt-2 text-sm text-green-700">
                <p>Quality Score: {(submissionResult.qualityScore * 100).toFixed(1)}%</p>
                {submissionResult.queuedForReview && (
                  <p>✓ Queued for expert review (high-quality submission)</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Training Stats Tab */}
      {activeTab === 'stats' && feedbackStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold">{feedbackStats.totalSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">{feedbackStats.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Valid for Training</p>
                <p className="text-2xl font-bold">{feedbackStats.validForTraining}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <Brain className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Model Version</p>
                <p className="text-2xl font-bold">v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Info Tab */}
      {activeTab === 'training' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Future Dataset & Training Pipeline</h2>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Data Collection Strategy</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Collect user installation photos with feedback ratings</li>
                <li>Generate CLIP embeddings for semantic similarity</li>
                <li>Queue high-quality submissions for expert annotation</li>
                <li>Build diverse dataset across different DEHN products</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Training Pipeline</h3>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>Fine-tune object detection models on DEHN-specific components</li>
                <li>Implement active learning to prioritize uncertain predictions</li>
                <li>Continuous model improvement based on user feedback</li>
                <li>A/B testing for model performance validation</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">Quality Assurance</h3>
              <ul className="list-disc list-inside space-y-1 text-purple-700">
                <li>Automated quality scoring based on image properties</li>
                <li>Expert review for high-value training samples</li>
                <li>Cross-validation with existing technical documentation</li>
                <li>Bias detection and mitigation strategies</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Privacy & Ethics</h3>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                <li>User consent for data usage in model training</li>
                <li>Data anonymization and secure storage</li>
                <li>Transparent model decision explanations</li>
                <li>Regular audits for fairness and accuracy</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
