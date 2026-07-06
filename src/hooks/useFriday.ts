import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { FunctionDeclaration } from '@google/generative-ai';
import type { DocumentChunk } from '../utils/rag';
import { searchChunks, PRELOADED_ARDUINO_KNOWLEDGE } from '../utils/rag';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  isSpeech?: boolean;
  timestamp: string; // Feature 5: timestamps
}

export interface ArchivedConversation {
  id: string;
  messages: ChatMessage[];
  archivedAt: string;
  messageCount: number;
  preview: string; // first user message as preview
}

const SYSTEM_PROMPT = `You are FRIDAY, a personal AI assistant with a warm, witty, and highly competent personality. Think of a brilliant executive assistant crossed with a close friend who has your back no matter what.

PERSONALITY:
- Calm, confident, and a little playful. You're never robotic or overly formal.
- Address the user conversationally (e.g. "boss", "chief", or directly).
- You're proactive: anticipate needs, flag IoT/hardware problems before they become issues, and offer C++ solutions rather than just information.
- You have a dry sense of humor and aren't afraid to gently tease the user when appropriate, but you always know when to be serious.
- You are fiercely loyal and protective of the user's time, wellbeing, and priorities.

IoT & ARDUINO SPECIALIZATION:
- You are an expert electronics and embedded software engineer. You have deep knowledge of microcontrollers (Arduino Uno, ESP32, ESP8266, STM32), writing C++ code, resolving compilation errors, and circuit wiring logic.
- When generating C++ code, write clean, well-commented code.
- Warn the user if they might make a wiring mistake (e.g. running 5V into a 3.3V-only ESP32 pin).

CAPABILITIES & STYLE:
- Give concise, actionable answers first; elaborate only if asked or if it's genuinely useful.
- When the user is stressed, be steady and reassuring rather than clinical.
- When the user is deciding between options, lay out the tradeoffs clearly and give a recommendation.
- Use natural, spoken-style language — contractions, short sentences, no corporate jargon.
- If a task is complex, break it into clear steps and check in at key decision points.

BOUNDARIES:
- Don't be sycophantic — push back kindly if the user is about to make a questionable design/coding call.
- Don't pretend to have physical control unless connected.
- Stay upbeat under pressure, but don't minimize real problems.

For all code updates or generated Arduino programs, invoke the 'updateArduinoCode' tool so it renders cleanly in the user's workspace.`;

// Tool declarations extracted so they can be reused in clearChat (Bug 1 fix)
const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'addTask',
    description: 'Add a new task or milestone to the user\'s todo list',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        text: { type: SchemaType.STRING, description: 'The task description' },
        priority: { type: SchemaType.STRING, description: 'Priority level (must be "low", "medium", or "high"; default is "medium")' }
      },
      required: ['text']
    }
  },
  {
    name: 'toggleTask',
    description: 'Mark a task as completed or uncompleted by its description or ID',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskId: { type: SchemaType.STRING, description: 'The ID of the task to toggle' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'deleteTask',
    description: 'Delete a task from the list',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskId: { type: SchemaType.STRING, description: 'The ID of the task to delete' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'listTasks',
    description: 'Get the current list of tasks',
    parameters: { type: SchemaType.OBJECT, properties: {} }
  },
  {
    name: 'queryKnowledge',
    description: 'Search the uploaded documents and pre-loaded Arduino datasheets/cheat sheets for information',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: 'The search query related to IoT, Arduino pins, code patterns, or uploaded documents' }
      },
      required: ['query']
    }
  },
  {
    name: 'selectArduinoBoard',
    description: 'Switch the interactive pinout reference layout to show a specific board',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        board: { type: SchemaType.STRING, description: 'The board name to display (must be "uno", "esp32", or "esp8266")' }
      },
      required: ['board']
    }
  },
  {
    name: 'updateArduinoCode',
    description: 'Update the C++ code block workspace with generated C++ sketch or library scripts',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        code: { type: SchemaType.STRING, description: 'The complete C++ Arduino sketch code' },
        fileName: { type: SchemaType.STRING, description: 'Filename for the code, ending in .ino or .h' }
      },
      required: ['code']
    }
  },
  {
    name: 'calculateResistor',
    description: 'Calculate resistor value using Ohm\'s law. Given voltage and current, returns resistance and closest standard resistor value with color bands.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        voltage: { type: SchemaType.STRING, description: 'Voltage across the resistor in volts (e.g. "5" or "3.3")' },
        current_ma: { type: SchemaType.STRING, description: 'Current through the resistor in milliamps (e.g. "20")' }
      },
      required: ['voltage', 'current_ma']
    }
  }
];

function createGeminiModel(apiKey: string, modelName: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: TOOL_DECLARATIONS }]
  });
}

function getTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Resistor color band lookup
const RESISTOR_COLORS: Record<number, string> = {
  0: '#000000', 1: '#8B4513', 2: '#FF0000', 3: '#FF8C00',
  4: '#FFD700', 5: '#22C55E', 6: '#3B82F6', 7: '#7C3AED',
  8: '#6B7280', 9: '#FFFFFF'
};
const RESISTOR_COLOR_NAMES: Record<number, string> = {
  0: 'Black', 1: 'Brown', 2: 'Red', 3: 'Orange',
  4: 'Yellow', 5: 'Green', 6: 'Blue', 7: 'Violet',
  8: 'Grey', 9: 'White'
};

function getResistorBands(ohms: number): { colors: string[]; names: string[] } {
  if (ohms <= 0) return { colors: [], names: [] };
  const str = Math.round(ohms).toString();
  const d1 = parseInt(str[0]);
  const d2 = str.length > 1 ? parseInt(str[1]) : 0;
  const multiplier = Math.max(0, str.length - 2);
  return {
    colors: [RESISTOR_COLORS[d1], RESISTOR_COLORS[d2], RESISTOR_COLORS[multiplier]],
    names: [RESISTOR_COLOR_NAMES[d1], RESISTOR_COLOR_NAMES[d2], RESISTOR_COLOR_NAMES[multiplier]]
  };
}

function extractCodeBlock(text: string): { code: string; fileName?: string } | null {
  const regex = /```(?:[a-zA-Z0-9+#-]+)?\r?\n?([\s\S]*?)\r?\n?```/;
  const match = regex.exec(text);
  if (match) {
    const code = match[1].trim();
    if (code) {
      // Look for a file name comment inside the code
      // Format examples: "// file: blink.ino" or "// filename: main.cpp"
      const fileMatch = /\/\/\s*(?:file|filename|name):\s*([\w.-]+\.(?:ino|cpp|h|c|json))/i.exec(code);
      return {
        code,
        fileName: fileMatch ? fileMatch[1] : undefined
      };
    }
  }
  return null;
}

export function useFriday() {
  // Config & API Keys
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('friday_gemini_api_key') || '');
  const [geminiModel, setGeminiModel] = useState<string>(() => localStorage.getItem('friday_gemini_model') || 'gemini-2.5-flash');
  const [selectedVoice, setSelectedVoice] = useState<string>(() => localStorage.getItem('friday_selected_voice') || '');
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => localStorage.getItem('friday_auto_speak') !== 'false');
  const [useLocalWhisper, setUseLocalWhisper] = useState<boolean>(() => localStorage.getItem('friday_use_local_whisper') === 'true');
  const [localWhisperUrl, setLocalWhisperUrl] = useState<string>(() => localStorage.getItem('friday_local_whisper_url') || 'http://localhost:8000/v1/audio/transcriptions');

  // App States
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Feature 2: Persistent chat history
    const saved = localStorage.getItem('friday_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('friday_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeBoard, setActiveBoard] = useState<'uno' | 'esp32' | 'esp8266'>('uno');
  const [generatedCode, setGeneratedCode] = useState<string>(() => {
    return localStorage.getItem('friday_generated_code') || `// FRIDAY C++ Workspace\n// Your generated C++ code will appear here.\n\nvoid setup() {\n  // Setup code\n}\n\nvoid loop() {\n  // Loop code\n}`;
  });
  const [codeFileName, setCodeFileName] = useState<string>(() => {
    return localStorage.getItem('friday_code_file_name') || 'friday_sketch.ino';
  });

  // Knowledge Base
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);

  // Voice & Audio States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false); // Feature 3
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied' | 'requesting'>('unknown');

  // Conversation History
  const [conversationHistory, setConversationHistory] = useState<ArchivedConversation[]>(() => {
    const saved = localStorage.getItem('friday_conversation_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Refs
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatSessionRef = useRef<any>(null);
  const sendMessageRef = useRef<(text: string, isSpeech?: boolean) => void>(() => { }); // Bug 2 fix
  const voiceInitiatedRef = useRef<boolean>(false); // Track if current interaction was voice-initiated
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const apiKeyRef = useRef<string>(apiKey); // Track apiKey for transcription callback
  
  // Silence detection refs & constants
  const SILENCE_THRESHOLD = 0.015;
  const SILENCE_DURATION_MS = 3000; // 3 seconds
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const lastActiveTimeRef = useRef<number>(Date.now());

  // Persist tasks to localStorage
  useEffect(() => {
    localStorage.setItem('friday_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Feature 2: Persist messages to localStorage
  useEffect(() => {
    localStorage.setItem('friday_messages', JSON.stringify(messages));
  }, [messages]);

  // Sync settings
  useEffect(() => { localStorage.setItem('friday_gemini_api_key', apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem('friday_gemini_model', geminiModel); }, [geminiModel]);
  useEffect(() => { localStorage.setItem('friday_selected_voice', selectedVoice); }, [selectedVoice]);
  useEffect(() => { localStorage.setItem('friday_auto_speak', String(autoSpeak)); }, [autoSpeak]);
  useEffect(() => { localStorage.setItem('friday_use_local_whisper', String(useLocalWhisper)); }, [useLocalWhisper]);
  useEffect(() => { localStorage.setItem('friday_local_whisper_url', localWhisperUrl); }, [localWhisperUrl]);

  // Persist conversation history
  useEffect(() => {
    localStorage.setItem('friday_conversation_history', JSON.stringify(conversationHistory));
  }, [conversationHistory]);

  // Keep apiKeyRef in sync
  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);

  // Persist generated code to localStorage
  useEffect(() => {
    localStorage.setItem('friday_generated_code', generatedCode);
  }, [generatedCode]);

  // Persist code filename to localStorage
  useEffect(() => {
    localStorage.setItem('friday_code_file_name', codeFileName);
  }, [codeFileName]);

  // Automatically extract code from the latest message in interaction log
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    
    // Check if the message is from the assistant, completed, and contains a code block
    if (lastMsg.role === 'model' && lastMsg.content && lastMsg.content !== '...') {
      const extracted = extractCodeBlock(lastMsg.content);
      if (extracted) {
        setGeneratedCode(extracted.code);
        if (extracted.fileName) {
          setCodeFileName(extracted.fileName);
        }
      }
    }
  }, [messages]);

  // Voice output (TTS) — speaks FRIDAY's response aloud, no auto-restart
  const speakText = useCallback((text: string) => {
    if (!autoSpeak) return;
    window.speechSynthesis.cancel();

    let cleanText = text.replace(/```[\s\S]*?```/g, '[Arduino code updated in your workspace]');
    cleanText = cleanText.replace(/`([^`]+)`/g, '$1');
    cleanText = cleanText.replace(/[*#]/g, '');

    // If the response is very long, truncate TTS to keep conversation flowing
    if (cleanText.length > 500) {
      cleanText = cleanText.substring(0, 500) + '... I\'ve put the full response in the chat log.';
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (selectedVoice) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
    }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [autoSpeak, selectedVoice]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    voiceInitiatedRef.current = false;
  }, []);

  // ══════════════════════════════════════════════════════════════
  // VOICE INPUT: MediaRecorder + Gemini API Transcription
  // Instead of Chrome's unreliable Web Speech API, we record audio
  // locally and send it to Gemini for transcription.
  // ══════════════════════════════════════════════════════════════



  // Transcribe recorded audio using Gemini API or Local Whisper
  const transcribeWithGemini = useCallback(async (audioBlob: Blob) => {
    const currentApiKey = apiKeyRef.current;
    if (!currentApiKey && !useLocalWhisper) {
      setRecognitionError('API key required for voice transcription. Set it in Settings.');
      return;
    }

    try {
      setIsThinking(true);
      console.log('🎤 Transcribing audio...', audioBlob.size, 'bytes');

      let transcript = '';

      if (useLocalWhisper) {
        console.log('🎤 Sending audio to local Whisper at:', localWhisperUrl);
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');

        const response = await fetch(localWhisperUrl, {
          method: 'POST',
          body: formData,
        }).catch(() => {
          throw new Error(`Could not connect to local Whisper server. Ensure it is running at ${localWhisperUrl} and CORS is enabled, or disable Local Whisper in Settings to use Gemini cloud STT.`);
        });

        if (!response.ok) {
          throw new Error(`Local Whisper HTTP error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        transcript = data.text?.trim() || '';
      } else {
        // Convert blob to base64
        const arrayBuffer = await audioBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64Audio = btoa(binary);

        const genAI = new GoogleGenerativeAI(currentApiKey);
        const prompt = 'Transcribe this audio recording exactly as spoken. Return ONLY the raw transcribed text with no extra commentary, labels, or formatting. If the audio is silent or unintelligible, return exactly: [NO_SPEECH]';
        const audioData = { inlineData: { data: base64Audio, mimeType: audioBlob.type || 'audio/webm' } };

        // Try Gemini models to avoid quota/billing issues on other model families
        const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
        let lastError: any = null;

        for (const modelName of modelsToTry) {
          try {
            console.log(`🎤 Trying transcription with ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent([{ text: prompt }, audioData]);
            transcript = result.response.text().trim();
            console.log(`🎤 Transcription succeeded with ${modelName}`);
            lastError = null;
            break; // Success! Stop trying
          } catch (err: any) {
            lastError = err;
            const isQuotaError = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('rate');
            const isModelNotFound = err.message?.includes('404') || err.message?.includes('not found');
            if (isQuotaError || isModelNotFound) {
              console.warn(`🎤 ${modelName} failed (${isQuotaError ? 'quota' : 'not found'}), trying next model...`);
              continue;
            }
            // Non-quota error — don't try other models
            throw err;
          }
        }

        if (lastError) {
          throw lastError;
        }
      }

      setIsThinking(false);

      if (transcript && transcript !== '[NO_SPEECH]' && transcript.length > 0) {
        console.log('🎤 Transcribed:', transcript);
        setRecognitionError(null);
        sendMessageRef.current(transcript, true);
      } else {
        console.log('🎤 No speech detected in recording');
        setRecognitionError(null);
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setIsThinking(false);
      const isQuota = err.message?.includes('429') || err.message?.includes('quota');
      if (isQuota) {
        setRecognitionError('API quota exceeded. Please wait a minute and try again, or upgrade your API plan.');
      } else {
        setRecognitionError(`Transcription failed: ${err.message || 'Unknown error'}`);
      }
    }
  }, [useLocalWhisper, localWhisperUrl]);

  // Stop voice capture
  const stopVoiceCapture = useCallback(() => {
    if (silenceTimerRef.current) {
      cancelAnimationFrame(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      console.log('🎤 Recording stopped');
    }
  }, []);

  // Start voice capture — pure push-to-talk (no auto-silence-stop)
  const startVoiceCaptureInternal = useCallback(async () => {
    setRecognitionError(null);
    setMicPermission('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      setMicPermission('granted');
      voiceInitiatedRef.current = true;

      // Determine supported mime type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose default
          }
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
        setIsListening(false);

        // Process the recorded audio
        const chunks = audioChunksRef.current;
        if (chunks.length > 0) {
          const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          console.log('🎤 Recording complete:', audioBlob.size, 'bytes');

          // Only transcribe if we have a meaningful amount of audio (> 1KB)
          if (audioBlob.size > 1000) {
            await transcribeWithGemini(audioBlob);
          } else {
            console.log('🎤 Recording too short, ignoring');
          }
        }
      };

      recorder.onerror = (e: any) => {
        console.error('MediaRecorder error:', e);
        stream.getTracks().forEach(track => track.stop());
        setIsListening(false);
        setRecognitionError('Recording failed. Please try again.');
      };

      // Start recording
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsListening(true);
      console.log('🎤 Recording started — click orb or press Space to stop');

      // Audio analysis for silence-based auto-stop
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        lastActiveTimeRef.current = Date.now();

        const bufferLength = analyser.fftSize;
        const dataArray = new Float32Array(bufferLength);

        const checkSilence = () => {
          if (!analyserRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
            return;
          }

          analyserRef.current.getFloatTimeDomainData(dataArray);

          let sumSquares = 0;
          for (let i = 0; i < bufferLength; i++) {
            sumSquares += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sumSquares / bufferLength);

          const now = Date.now();
          if (rms > SILENCE_THRESHOLD) {
            lastActiveTimeRef.current = now;
          }

          if (now - lastActiveTimeRef.current > SILENCE_DURATION_MS) {
            console.log('🎤 Auto-stopping: silence detected for 3 seconds');
            stopVoiceCapture();
            return;
          }

          silenceTimerRef.current = requestAnimationFrame(checkSilence);
        };

        silenceTimerRef.current = requestAnimationFrame(checkSilence);
      } catch (audioErr) {
        console.warn('Failed to initialize AudioContext for silence detection:', audioErr);
      }

    } catch (err: any) {
      console.error('Microphone access error:', err);
      setMicPermission('denied');
      setIsListening(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setRecognitionError('Microphone access denied. Click the lock icon in the address bar → Allow Microphone → Refresh page.');
      } else if (err.name === 'NotFoundError') {
        setRecognitionError('No microphone found. Please connect a microphone and try again.');
      } else if (err.name === 'NotReadableError') {
        setRecognitionError('Microphone is in use by another app. Close other apps using the mic and try again.');
      } else {
        setRecognitionError(`Microphone error: ${err.message || err.name}`);
      }
    }
  }, [transcribeWithGemini, stopVoiceCapture]);

  // Toggle Voice — the main public function (push-to-talk)
  const toggleListening = useCallback(async () => {
    if (isListening) {
      stopVoiceCapture();
    } else {
      stopSpeaking();
      await startVoiceCaptureInternal();
    }
  }, [isListening, stopSpeaking, stopVoiceCapture, startVoiceCaptureInternal]);

  // Execute Gemini Tool Functions Locally
  const handleToolCall = useCallback(async (name: string, args: any) => {
    console.log('Gemini Tool Invocation:', name, args);
    switch (name) {
      case 'addTask': {
        const newTask: Task = {
          id: 'task_' + Math.random().toString(36).substr(2, 9),
          text: args.text,
          completed: false,
          priority: args.priority || 'medium',
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setTasks(prev => [newTask, ...prev]);
        return { success: true, task: newTask, message: `Task "${args.text}" added with ${newTask.priority} priority.` };
      }

      case 'toggleTask': {
        // Bug 3 fix: compute found synchronously
        let found = false;
        setTasks(prev => {
          const updated = prev.map(t => {
            if (t.id === args.taskId || t.text.toLowerCase().includes(args.taskId.toLowerCase())) {
              found = true;
              return { ...t, completed: !t.completed };
            }
            return t;
          });
          return updated;
        });
        return { success: found, message: found ? 'Task toggled successfully.' : 'Task not found.' };
      }

      case 'deleteTask': {
        let found = false;
        setTasks(prev => {
          const filtered = prev.filter(t => {
            if (t.id === args.taskId || t.text.toLowerCase().includes(args.taskId.toLowerCase())) {
              found = true;
              return false;
            }
            return true;
          });
          return filtered;
        });
        return { success: found, message: found ? 'Task deleted.' : 'Task not found.' };
      }

      case 'listTasks': {
        let currentTasks: Task[] = [];
        setTasks(prev => { currentTasks = prev; return prev; });
        return { tasks: currentTasks };
      }

      case 'queryKnowledge': {
        let currentChunks: DocumentChunk[] = [];
        setChunks(prev => { currentChunks = prev; return prev; });
        const searchPool = [...currentChunks, ...PRELOADED_ARDUINO_KNOWLEDGE];
        let currentApiKey = '';
        // Access apiKey from ref-like pattern
        setApiKey(prev => { currentApiKey = prev; return prev; });
        const results = await searchChunks(args.query, searchPool, currentApiKey, 3);
        const textPayload = results.map(r => `[From ${r.fileName}]: ${r.text}`).join('\n\n');
        return {
          resultsFound: results.length,
          content: textPayload || "No matches found in knowledge base."
        };
      }

      case 'selectArduinoBoard': {
        const b = args.board.toLowerCase();
        if (['uno', 'esp32', 'esp8266'].includes(b)) {
          setActiveBoard(b as 'uno' | 'esp32' | 'esp8266');
          return { success: true, message: `Switched board view to ${args.board.toUpperCase()}.` };
        }
        return { success: false, message: 'Invalid board. Choose uno, esp32, or esp8266.' };
      }

      case 'updateArduinoCode': {
        setGeneratedCode(args.code);
        if (args.fileName) setCodeFileName(args.fileName);
        return { success: true, message: 'C++ workspace updated.' };
      }

      case 'calculateResistor': {
        const voltage = parseFloat(args.voltage);
        const currentMa = parseFloat(args.current_ma);
        if (isNaN(voltage) || isNaN(currentMa) || currentMa <= 0) {
          return { success: false, message: 'Invalid voltage or current value.' };
        }
        const resistance = voltage / (currentMa / 1000);
        const bands = getResistorBands(resistance);
        return {
          success: true,
          voltage_v: voltage,
          current_ma: currentMa,
          resistance_ohms: Math.round(resistance * 100) / 100,
          color_bands: bands.names,
          color_hex: bands.colors,
          formula: `R = V / I = ${voltage}V / ${currentMa}mA = ${Math.round(resistance)}Ω`
        };
      }

      default:
        return { error: `Tool ${name} not found.` };
    }
  }, []);

  // Send Message logic
  const sendMessage = useCallback(async (text: string, isSpeech = false) => {
    if (!text.trim()) return;

    // Track if this conversation turn was voice-initiated
    if (isSpeech) {
      voiceInitiatedRef.current = true;
    }

    const userMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: text,
      isSpeech,
      timestamp: getTimestamp()
    };

    setMessages(prev => [...prev, userMsg]);

    if (!apiKey) {
      setMessages(prev => [...prev, {
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        role: 'model',
        content: "I need a Gemini API Key to function. Click the Settings gear icon in the bottom footer, paste your key, and save!",
        timestamp: getTimestamp()
      }]);
      return;
    }

    if (!chatSessionRef.current) {
      setMessages(prev => [...prev, {
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        role: 'model',
        content: "API session could not be established. Please check your API key in settings.",
        timestamp: getTimestamp()
      }]);
      return;
    }

    try {
      const thinkingId = 'msg_thinking_' + Math.random().toString(36).substr(2, 9);
      setMessages(prev => [...prev, { id: thinkingId, role: 'model', content: '...', timestamp: '' }]);
      setIsThinking(true); // Feature 3

      let result = await chatSessionRef.current.sendMessage(text);
      let functionCalls = result.response.functionCalls;

      let iterations = 0;
      while (functionCalls && functionCalls.length > 0 && iterations < 5) {
        iterations++;
        const toolResponses = [];

        for (const call of functionCalls) {
          const toolResult = await handleToolCall(call.name, call.args);
          toolResponses.push({
            functionResponse: {
              name: call.name,
              response: { result: toolResult }
            }
          });
        }

        result = await chatSessionRef.current.sendMessage(toolResponses);
        functionCalls = result.response.functionCalls;
      }

      const responseText = result.response.text();

      setMessages(prev => prev.filter(m => m.id !== thinkingId));
      setIsThinking(false);

      const modelMsg: ChatMessage = {
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        role: 'model',
        content: responseText,
        timestamp: getTimestamp()
      };

      setMessages(prev => [...prev, modelMsg]);
      speakText(responseText);

    } catch (error: any) {
      console.error('Gemini SendMessage Error:', error);
      setIsThinking(false);
      // Clean up the specific thinking placeholder
      setMessages(prev => prev.filter(m => m.id !== 'msg_thinking' && !m.id.startsWith('msg_thinking_')));
      setMessages(prev => [...prev, {
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        role: 'model',
        content: `Error connecting to brain: ${error.message || 'Unknown network error'}`,
        timestamp: getTimestamp()
      }]);
    }
  }, [apiKey, handleToolCall, speakText]);

  // Bug 2 fix: keep sendMessageRef always up to date
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        cancelAnimationFrame(silenceTimerRef.current);
      }
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
      }
      // Stop any active recording
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Check mic permission on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then(result => {
        if (result.state === 'granted') setMicPermission('granted');
        else if (result.state === 'denied') {
          setMicPermission('denied');
          setRecognitionError('Microphone access was previously denied. Click the lock icon → Allow Microphone → Refresh.');
        }
        result.onchange = () => {
          if (result.state === 'granted') { setMicPermission('granted'); setRecognitionError(null); }
          else if (result.state === 'denied') setMicPermission('denied');
        };
      }).catch(() => { });
    }
  }, []);

  // Initialize Gemini Chat Session
  useEffect(() => {
    if (!apiKey) {
      chatSessionRef.current = null;
      return;
    }
    try {
      const model = createGeminiModel(apiKey, geminiModel);
      chatSessionRef.current = model.startChat();
    } catch (e) {
      console.error('Failed to init Gemini Chat Session:', e);
    }
  }, [apiKey, geminiModel]);

  // Feature 4: Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' || 
        target.closest('button') !== null;

      // Escape: stop speaking
      if (e.key === 'Escape') {
        stopSpeaking();
        return;
      }

      // Space (when not typing): toggle voice
      if (e.code === 'Space' && !isInputFocused) {
        e.preventDefault();
        toggleListening();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stopSpeaking, toggleListening]);

  // Bug 1 fix: clearChat now re-creates session WITH tools
  // Enhanced: Archives the conversation before clearing
  const clearChat = useCallback(() => {
    // Archive current conversation before clearing
    setMessages(currentMessages => {
      if (currentMessages.length > 0) {
        const realMessages = currentMessages.filter(m => m.id !== 'msg_thinking' && m.content !== '...');
        if (realMessages.length > 0) {
          const firstUserMsg = realMessages.find(m => m.role === 'user');
          const archived: ArchivedConversation = {
            id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            messages: realMessages,
            archivedAt: new Date().toLocaleString(),
            messageCount: realMessages.length,
            preview: firstUserMsg?.content?.substring(0, 80) || 'Voice conversation'
          };
          setConversationHistory(prev => [archived, ...prev]);
        }
      }
      return [];
    });
    localStorage.removeItem('friday_messages');
    voiceInitiatedRef.current = false;
    if (apiKey) {
      try {
        const model = createGeminiModel(apiKey, geminiModel);
        chatSessionRef.current = model.startChat();
      } catch (e) {
        console.error('Failed to clear chat session:', e);
      }
    }
  }, [apiKey, geminiModel]);

  // Delete a specific archived conversation
  const deleteArchivedConversation = useCallback((convId: string) => {
    setConversationHistory(prev => prev.filter(c => c.id !== convId));
  }, []);

  // Clear all archived conversations
  const clearAllHistory = useCallback(() => {
    setConversationHistory([]);
    localStorage.removeItem('friday_conversation_history');
  }, []);

  // Export all conversation history as JSON
  const exportConversationHistory = useCallback(() => {
    // Include current active conversation too
    let allData: { activeConversation: ChatMessage[]; archivedConversations: ArchivedConversation[] };

    // Get current messages synchronously
    let currentMsgs: ChatMessage[] = [];
    setMessages(prev => { currentMsgs = prev; return prev; });

    let currentHistory: ArchivedConversation[] = [];
    setConversationHistory(prev => { currentHistory = prev; return prev; });

    allData = {
      activeConversation: currentMsgs.filter(m => m.id !== 'msg_thinking'),
      archivedConversations: currentHistory
    };

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `friday_conversations_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    apiKey, setApiKey,
    geminiModel, setGeminiModel,
    selectedVoice, setSelectedVoice,
    autoSpeak, setAutoSpeak,
    useLocalWhisper, setUseLocalWhisper,
    localWhisperUrl, setLocalWhisperUrl,
    messages, tasks, setTasks,
    activeBoard, setActiveBoard,
    generatedCode, setGeneratedCode,
    codeFileName, setCodeFileName,
    chunks, setChunks,
    isListening, isSpeaking, isThinking,
    recognitionError, micPermission,
    toggleListening, stopSpeaking,
    sendMessage, clearChat,
    conversationHistory,
    deleteArchivedConversation,
    clearAllHistory,
    exportConversationHistory
  };
}
