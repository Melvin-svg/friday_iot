
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Eye, EyeOff, Save, VolumeX, Volume2, Trash2 } from 'lucide-react';

interface SettingsProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  geminiModel: string;
  setGeminiModel: (model: string) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  autoSpeak: boolean;
  setAutoSpeak: (speak: boolean) => void;
  onClearChat: () => void;
  useLocalWhisper: boolean;
  setUseLocalWhisper: (val: boolean) => void;
  localWhisperUrl: string;
  setLocalWhisperUrl: (url: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  apiKey,
  setApiKey,
  geminiModel,
  setGeminiModel,
  selectedVoice,
  setSelectedVoice,
  autoSpeak,
  setAutoSpeak,
  onClearChat,
  useLocalWhisper,
  setUseLocalWhisper,
  localWhisperUrl,
  setLocalWhisperUrl
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempModel, setTempModel] = useState(geminiModel);
  const [showKey, setShowKey] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [tempWhisperUrl, setTempWhisperUrl] = useState(localWhisperUrl);

  // Load browser voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices.filter(v => v.lang.startsWith('en')));
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      
      // Fallback polling for browsers that don't trigger events immediately
      const intervalId = setInterval(() => {
        const currentVoices = window.speechSynthesis.getVoices();
        if (currentVoices.length > 0) {
          loadVoices();
          clearInterval(intervalId);
        }
      }, 250);

      // Stop polling after 4 seconds to prevent battery drain
      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
      }, 4000);

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    }
  }, []);

  // Sync temp states when panel opens
  useEffect(() => {
    if (isOpen) {
      setTempKey(apiKey);
      setTempModel(geminiModel);
      setTempWhisperUrl(localWhisperUrl);
    }
  }, [isOpen, apiKey, geminiModel, localWhisperUrl]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(tempKey);
    setGeminiModel(tempModel);
    setLocalWhisperUrl(tempWhisperUrl);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Settings Toggle Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-400 text-slate-400 hover:text-cyan-300 transition-all flex items-center gap-1.5 text-xs font-semibold animate-pulse"
      >
        <SettingsIcon className={`w-4 h-4 ${isOpen ? 'animate-spin' : ''}`} />
        Configure Assistant
      </button>

      {/* Settings Overlay Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[480px] max-w-[95%] p-6 rounded-2xl border border-white/10 bg-slate-950/95 backdrop-filter blur-xl shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200 text-left">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-cyan-400" />
                System Parameters
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-200 p-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {/* Gemini Key Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Gemini API Key</label>
                <div className="relative flex">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={tempKey}
                    onChange={e => setTempKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-900 border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 leading-normal">
                  Don't have a key? Get one from Google AI Studio. It is saved locally in your browser storage.
                </span>
              </div>

              {/* Gemini Model Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Gemini Brain Model</label>
                <select
                  value={tempModel}
                  onChange={e => setTempModel(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended)</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Fast)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Legacy)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Intelligent, slower)</option>
                  <option value="gemma-4-26b-a4b-it">gemma-4-26b-a4b-it (Experimental / Deprecated)</option>
                </select>
                <span className="text-[10px] text-slate-500 leading-normal">
                  Select the model that powers the assistant's brain. Gemini models are highly recommended as they support systems instructions and tools.
                </span>
              </div>

              {/* Local Whisper Toggle & URL Input */}
              <div className="flex flex-col gap-3 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-200">Local Whisper STT</span>
                    <span className="text-[11px] text-slate-500">Transcribe voice locally</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={useLocalWhisper}
                    onChange={e => setUseLocalWhisper(e.target.checked)}
                    className="rounded border-white/10 bg-slate-900 text-cyan-500 focus:ring-cyan-400 w-5 h-5 cursor-pointer"
                  />
                </div>

                {useLocalWhisper && (
                  <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Whisper API Endpoint</label>
                    <input
                      type="text"
                      value={tempWhisperUrl}
                      onChange={e => setTempWhisperUrl(e.target.value)}
                      placeholder="http://localhost:8000/v1/audio/transcriptions"
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-500 leading-normal">
                      OpenAI-compatible Whisper endpoint URL.
                    </span>
                  </div>
                )}
              </div>

              {/* Auto-Speak Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-b border-white/5 my-1">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-200">Voice Synthesis (TTS)</span>
                  <span className="text-[11px] text-slate-500">FRIDAY reads responses aloud</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  className={`p-2 rounded-lg border transition-all ${
                    autoSpeak 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                      : 'bg-transparent text-slate-500 border-white/5'
                  }`}
                >
                  {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>

              {/* Voice Select Dropdown */}
              {autoSpeak && voices.length > 0 && (
                <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Voice Profile</label>
                  <select
                    value={selectedVoice}
                    onChange={e => setSelectedVoice(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="">Default System Voice</option>
                    {voices.map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Save Buttons & Actions */}
              <div className="flex gap-3 pt-3 border-t border-white/5">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/15"
                >
                  <Save className="w-4 h-4" />
                  Save Config
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear assistant conversation logs?')) {
                      onClearChat();
                      setIsOpen(false);
                    }
                  }}
                  className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-all"
                  title="Reset Conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
