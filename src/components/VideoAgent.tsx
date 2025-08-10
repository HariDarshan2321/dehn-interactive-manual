'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Mic, MicOff, Video, VideoOff, Phone, PhoneOff, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface VideoAgentProps {
  productId: string;
  language: string;
  onResponse?: (response: any) => void;
}

interface SessionState {
  isConnected: boolean;
  sessionId: string | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isProcessing: boolean;
  error: string | null;
}

interface AnalysisResult {
  detected_objects: Array<{
    name: string;
    confidence: number;
    status: 'correct' | 'incorrect' | 'missing';
    issues: string[];
  }>;
  installation_guidance: string[];
  safety_alerts: string[];
  ai_response: string;
}

export default function VideoAgent({ productId, language, onResponse }: VideoAgentProps) {
  const [sessionState, setSessionState] = useState<SessionState>({
    isConnected: false,
    sessionId: null,
    isVideoEnabled: false,
    isAudioEnabled: false,
    isProcessing: false,
    error: null
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [installationProgress, setInstallationProgress] = useState<any>({});
  const [nextSteps, setNextSteps] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `ws://localhost:8001/ws/video-agent/${productId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setSessionState(prev => ({ ...prev, isConnected: true, error: null }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'session_ready':
          setSessionState(prev => ({
            ...prev,
            sessionId: data.session_id
          }));
          break;

        case 'analysis_result':
          setAnalysisResult(data.data.analysis);
          setInstallationProgress(data.data.installation_progress);
          setNextSteps(data.data.next_steps);
          setSessionState(prev => ({ ...prev, isProcessing: false }));
          onResponse?.(data.data);
          break;

        case 'audio_response':
          setAnalysisResult(prev => prev ? {
            ...prev,
            ai_response: data.data.response.answer
          } : null);
          setSessionState(prev => ({ ...prev, isProcessing: false }));
          onResponse?.(data.data);
          break;

        case 'error':
          setSessionState(prev => ({
            ...prev,
            error: data.message,
            isProcessing: false
          }));
          break;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setSessionState(prev => ({ ...prev, isConnected: false }));
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setSessionState(prev => ({
        ...prev,
        error: 'Connection error',
        isConnected: false
      }));
    };

    wsRef.current = ws;
  }, [productId, onResponse]);

  // Start video stream
  const startVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      streamRef.current = stream;
      setSessionState(prev => ({
        ...prev,
        isVideoEnabled: true,
        isAudioEnabled: true
      }));

      // Start sending frames
      startFrameCapture();

    } catch (error) {
      console.error('Error accessing camera:', error);
      setSessionState(prev => ({
        ...prev,
        error: 'Camera access denied'
      }));
    }
  };

  // Stop video stream
  const stopVideoStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setSessionState(prev => ({
      ...prev,
      isVideoEnabled: false,
      isAudioEnabled: false
    }));
  };

  // Capture and send video frames
  const startFrameCapture = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          // Convert to base64
          const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

          // Send frame to backend
          wsRef.current.send(JSON.stringify({
            type: 'video_frame',
            frame: frameData,
            audio: null // Audio processing would be added here
          }));

          setSessionState(prev => ({ ...prev, isProcessing: true }));
        }
      }
    }, 2000); // Send frame every 2 seconds
  };

  // Send audio-only message
  const sendAudioMessage = async (audioBlob: Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const reader = new FileReader();
      reader.onload = () => {
        const audioData = (reader.result as string).split(',')[1];
        wsRef.current?.send(JSON.stringify({
          type: 'audio_only',
          audio: audioData
        }));
        setSessionState(prev => ({ ...prev, isProcessing: true }));
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (sessionState.isVideoEnabled) {
      stopVideoStream();
    } else {
      startVideoStream();
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !sessionState.isAudioEnabled;
      });
      setSessionState(prev => ({
        ...prev,
        isAudioEnabled: !prev.isAudioEnabled
      }));
    }
  };

  // Start/stop session
  const toggleSession = () => {
    if (sessionState.isConnected) {
      // End session
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: 'end_session' }));
        wsRef.current.close();
      }
      stopVideoStream();
      setSessionState({
        isConnected: false,
        sessionId: null,
        isVideoEnabled: false,
        isAudioEnabled: false,
        isProcessing: false,
        error: null
      });
    } else {
      // Start session
      connectWebSocket();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopVideoStream();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct': return 'text-green-600';
      case 'incorrect': return 'text-red-600';
      case 'missing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'correct': return <CheckCircle className="w-4 h-4" />;
      case 'incorrect': return <XCircle className="w-4 h-4" />;
      case 'missing': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Video className="w-5 h-5 mr-2 text-blue-600" />
          Live Video Assistant
        </h3>

        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            sessionState.isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-600">
            {sessionState.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {sessionState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-red-800 text-sm">{sessionState.error}</span>
          </div>
        </div>
      )}

      {/* Video Display */}
      <div className="relative mb-4">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-64 bg-gray-900 rounded-lg object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {sessionState.isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="bg-white px-4 py-2 rounded-lg flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
              <span className="text-sm font-medium">Analyzing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={toggleSession}
          className={`px-6 py-3 rounded-full font-semibold flex items-center space-x-2 ${
            sessionState.isConnected
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {sessionState.isConnected ? (
            <>
              <PhoneOff className="w-4 h-4" />
              <span>End Session</span>
            </>
          ) : (
            <>
              <Phone className="w-4 h-4" />
              <span>Start Session</span>
            </>
          )}
        </button>

        {sessionState.isConnected && (
          <>
            <button
              onClick={toggleVideo}
              className={`px-4 py-3 rounded-full ${
                sessionState.isVideoEnabled
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {sessionState.isVideoEnabled ? (
                <Video className="w-4 h-4" />
              ) : (
                <VideoOff className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={toggleAudio}
              className={`px-4 py-3 rounded-full ${
                sessionState.isAudioEnabled
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {sessionState.isAudioEnabled ? (
                <Mic className="w-4 h-4" />
              ) : (
                <MicOff className="w-4 h-4" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-4">
          {/* AI Response */}
          {analysisResult.ai_response && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">AI Assistant</h4>
              <p className="text-blue-800 text-sm">{analysisResult.ai_response}</p>
            </div>
          )}

          {/* Safety Alerts */}
          {analysisResult.safety_alerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Safety Alerts
              </h4>
              <ul className="space-y-1">
                {analysisResult.safety_alerts.map((alert, index) => (
                  <li key={index} className="text-red-800 text-sm">• {alert}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Detected Objects */}
          {analysisResult.detected_objects.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Detected Components</h4>
              <div className="space-y-2">
                {analysisResult.detected_objects.map((obj, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center space-x-2">
                      <span className={getStatusColor(obj.status)}>
                        {getStatusIcon(obj.status)}
                      </span>
                      <span className="font-medium">{obj.name}</span>
                      <span className="text-sm text-gray-500">
                        ({Math.round(obj.confidence * 100)}%)
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${getStatusColor(obj.status)}`}>
                      {obj.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Installation Guidance */}
          {analysisResult.installation_guidance.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Next Steps</h4>
              <ul className="space-y-1">
                {analysisResult.installation_guidance.map((step, index) => (
                  <li key={index} className="text-green-800 text-sm">• {step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">How to use:</h4>
        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            Click "Start Session" to connect to the AI assistant
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            Enable video to show your installation progress
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            Enable audio to ask questions verbally
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            Get real-time feedback and safety alerts
          </div>
        </div>
      </div>
    </div>
  );
}
