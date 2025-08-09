import asyncio
import json
import base64
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import cv2
import numpy as np

from models.schemas import VideoAnalysisResult, DetectedComponent, SessionInfo

logger = logging.getLogger(__name__)

class VideoAgent:
    def __init__(self):
        self.active_sessions: Dict[str, Dict] = {}
        self.model_config = {
            "temperature": 0.1,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 1000,
        }

        # Safety settings for electrical installation context
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,  # Allow electrical safety content
        }

    async def create_session(self, product_id: str, product_data: Dict) -> Dict:
        """Create a new video agent session"""
        session_id = str(uuid.uuid4())

        session = {
            "id": session_id,
            "product_id": product_id,
            "product_name": product_data["name"],
            "product_context": product_data,
            "created_at": datetime.now(),
            "status": "active",
            "conversation_history": [],
            "detected_objects_history": [],
            "current_step": 1,
            "installation_progress": {}
        }

        self.active_sessions[session_id] = session
        logger.info(f"Created video agent session {session_id} for product {product_id}")

        return {
            "id": session_id,
            "product_name": product_data["name"],
            "status": "ready"
        }

    async def process_video_frame(self, session_id: str, frame_base64: str, audio_base64: Optional[str] = None) -> Dict:
        """Process a video frame with optional audio using Gemini Live API"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")

        session = self.active_sessions[session_id]

        try:
            # Prepare multimodal input
            parts = []

            # Add system context about the product
            system_prompt = self._build_system_prompt(session["product_context"])
            parts.append({"text": system_prompt})

            # Add video frame
            parts.append({
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": frame_base64
                }
            })

            # Add audio if provided
            audio_transcript = None
            if audio_base64:
                # For now, we'll use a placeholder for audio processing
                # In production, you'd use speech-to-text first
                audio_transcript = await self._process_audio_to_text(audio_base64)
                if audio_transcript:
                    parts.append({"text": f"User said: {audio_transcript}"})

            # Generate response using Gemini
            model = genai.GenerativeModel(
                model_name="gemini-1.5-pro-latest",
                generation_config=self.model_config,
                safety_settings=self.safety_settings
            )

            response = await model.generate_content_async(parts)

            # Parse the response
            analysis_result = await self._parse_video_analysis(response.text, session)

            # Update session history
            session["conversation_history"].append({
                "timestamp": datetime.now(),
                "frame_analyzed": True,
                "audio_transcript": audio_transcript,
                "ai_response": analysis_result["ai_response"],
                "detected_objects": analysis_result["detected_objects"]
            })

            # Update installation progress
            await self._update_installation_progress(session, analysis_result)

            return {
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                "analysis": analysis_result,
                "installation_progress": session["installation_progress"],
                "next_steps": await self._get_next_steps(session)
            }

        except Exception as e:
            logger.error(f"Error processing video frame: {e}")
            return {
                "session_id": session_id,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def process_audio(self, session_id: str, audio_base64: str) -> Dict:
        """Process audio-only input"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")

        session = self.active_sessions[session_id]

        try:
            # Convert audio to text
            transcript = await self._process_audio_to_text(audio_base64)

            if not transcript:
                return {
                    "session_id": session_id,
                    "error": "Could not process audio",
                    "timestamp": datetime.now().isoformat()
                }

            # Generate text response with product context
            response = await self.generate_text_response(
                transcript,
                session["product_context"]["documents"][:5],  # Use top 5 relevant docs
                session["product_id"],
                "en"  # Default language
            )

            # Update session
            session["conversation_history"].append({
                "timestamp": datetime.now(),
                "audio_transcript": transcript,
                "ai_response": response["answer"],
                "frame_analyzed": False
            })

            return {
                "session_id": session_id,
                "transcript": transcript,
                "response": response,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error processing audio: {e}")
            return {
                "session_id": session_id,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def detect_objects_in_image(self, image_base64: str, product_id: str, step_number: int, product_data: Dict) -> Dict:
        """Detect objects in a static image"""
        try:
            # Build context-aware prompt
            expected_components = await self._get_expected_components(product_id, step_number, product_data)

            prompt = f"""
            Analyze this DEHN electrical installation image for step {step_number} of product {product_id}.

            Expected components for this step: {', '.join(expected_components)}

            For each component, determine:
            1. Is it present and correctly positioned?
            2. Are there any installation errors?
            3. Any safety concerns?
            4. Confidence level (0.0-1.0)

            Respond in JSON format:
            {{
                "detected_components": [
                    {{
                        "name": "component_name",
                        "confidence": 0.95,
                        "status": "correct|incorrect|missing",
                        "issues": ["list of issues if any"]
                    }}
                ],
                "overall_status": "complete|incomplete|error",
                "suggestions": ["improvement suggestions"],
                "safety_alerts": ["critical safety issues"]
            }}
            """

            model = genai.GenerativeModel(
                model_name="gemini-1.5-pro-latest",
                generation_config=self.model_config,
                safety_settings=self.safety_settings
            )

            response = await model.generate_content_async([
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": image_base64
                    }
                }
            ])

            # Parse JSON response
            try:
                result = json.loads(response.text)

                # Calculate overall confidence
                if result["detected_components"]:
                    avg_confidence = sum(comp["confidence"] for comp in result["detected_components"]) / len(result["detected_components"])
                else:
                    avg_confidence = 0.0

                return {
                    "detected_components": result["detected_components"],
                    "overall_status": result["overall_status"],
                    "suggestions": result["suggestions"],
                    "safety_alerts": result.get("safety_alerts", []),
                    "confidence": avg_confidence
                }

            except json.JSONDecodeError:
                # Fallback parsing if JSON is malformed
                return await self._fallback_object_detection(response.text, expected_components)

        except Exception as e:
            logger.error(f"Error in object detection: {e}")
            return {
                "detected_components": [],
                "overall_status": "error",
                "suggestions": ["Error analyzing image. Please try again."],
                "safety_alerts": [],
                "confidence": 0.0
            }

    async def generate_text_response(self, query: str, relevant_docs: List[Dict], product_id: str, language: str) -> Dict:
        """Generate text response using product context"""
        try:
            # Build context from relevant documents
            context_text = "\n\n".join([
                f"[Page {doc.get('page_number', 'N/A')}]: {doc.get('content', '')}"
                for doc in relevant_docs[:5]
            ])

            prompt = f"""
            You are a DEHN electrical installation expert assistant. Answer the user's question using ONLY the provided manual content.

            Product: {product_id}
            Language: {language}

            Manual Content:
            {context_text}

            User Question: {query}

            Instructions:
            1. Answer only based on the provided manual content
            2. Include specific page references
            3. Highlight any safety warnings
            4. Be precise and technical
            5. If information is not in the manual, say so clearly

            Respond in JSON format:
            {{
                "answer": "detailed answer",
                "sources": [
                    {{"page": 1, "section": "Installation", "relevance": 0.95}}
                ],
                "confidence": 0.9,
                "safety_warnings": ["warning 1", "warning 2"]
            }}
            """

            model = genai.GenerativeModel(
                model_name="gemini-1.5-pro-latest",
                generation_config=self.model_config,
                safety_settings=self.safety_settings
            )

            response = await model.generate_content_async(prompt)

            try:
                result = json.loads(response.text)
                return result
            except json.JSONDecodeError:
                # Fallback response
                return {
                    "answer": response.text,
                    "sources": [{"page": "Multiple", "section": "General", "relevance": 0.8}],
                    "confidence": 0.7,
                    "safety_warnings": []
                }

        except Exception as e:
            logger.error(f"Error generating text response: {e}")
            return {
                "answer": "I apologize, but I encountered an error processing your question. Please try again.",
                "sources": [],
                "confidence": 0.0,
                "safety_warnings": []
            }

    async def end_session(self, session_id: str):
        """End a video agent session"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["status"] = "ended"
            self.active_sessions[session_id]["ended_at"] = datetime.now()
            logger.info(f"Ended video agent session {session_id}")

    def _build_system_prompt(self, product_context: Dict) -> str:
        """Build system prompt with product context"""
        return f"""
        You are an expert DEHN electrical installation assistant analyzing a live video feed.

        Product: {product_context['name']}
        Context: You are helping a user install this DEHN electrical protection device.

        Your tasks:
        1. Identify electrical components in the video
        2. Check installation correctness
        3. Provide real-time guidance
        4. Alert about safety issues immediately
        5. Guide through installation steps

        Always prioritize safety and provide clear, actionable guidance.
        """

    async def _parse_video_analysis(self, response_text: str, session: Dict) -> Dict:
        """Parse video analysis response"""
        try:
            # Try to parse as JSON first
            if response_text.strip().startswith('{'):
                return json.loads(response_text)

            # Fallback: extract key information
            return {
                "ai_response": response_text,
                "detected_objects": [],
                "installation_guidance": [],
                "safety_alerts": []
            }
        except:
            return {
                "ai_response": response_text,
                "detected_objects": [],
                "installation_guidance": [],
                "safety_alerts": []
            }

    async def _process_audio_to_text(self, audio_base64: str) -> Optional[str]:
        """Convert audio to text (placeholder - implement with speech-to-text service)"""
        # In production, integrate with Google Speech-to-Text or similar
        # For now, return a placeholder
        return "Audio processing not implemented yet"

    async def _get_expected_components(self, product_id: str, step_number: int, product_data: Dict) -> List[str]:
        """Get expected components for a specific installation step"""
        # This would be based on the product manual content
        # For now, return common DEHN components
        return [
            "surge protector",
            "terminal block",
            "ground wire",
            "live wire",
            "neutral wire",
            "mounting bracket",
            "connection terminals"
        ]

    async def _update_installation_progress(self, session: Dict, analysis_result: Dict):
        """Update installation progress based on analysis"""
        # Update progress tracking
        if "detected_objects" in analysis_result:
            session["installation_progress"][f"step_{session['current_step']}"] = {
                "completed": len(analysis_result["detected_objects"]) > 0,
                "timestamp": datetime.now(),
                "components_detected": len(analysis_result["detected_objects"])
            }

    async def _get_next_steps(self, session: Dict) -> List[str]:
        """Get next installation steps"""
        return [
            "Continue with the current installation step",
            "Verify all connections are secure",
            "Check safety requirements"
        ]

    async def _fallback_object_detection(self, response_text: str, expected_components: List[str]) -> Dict:
        """Fallback object detection parsing"""
        return {
            "detected_components": [
                {
                    "name": comp,
                    "confidence": 0.5,
                    "status": "unknown",
                    "issues": []
                } for comp in expected_components[:3]
            ],
            "overall_status": "incomplete",
            "suggestions": ["Please ensure all components are visible and properly positioned"],
            "safety_alerts": [],
            "confidence": 0.5
        }
