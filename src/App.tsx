import { useEffect, useRef, useState } from 'react';
import { Bot, Sparkles, Send, Trash2, ArrowUpRight, Cpu } from 'lucide-react';
import { useFriday } from './hooks/useFriday';
import { VoiceOrb } from './components/VoiceOrb';
import { ArduinoPinout } from './components/ArduinoPinout';
import { ArduinoWorkspace } from './components/ArduinoWorkspace';
import { TaskManager } from './components/TaskManager';
import { KnowledgeBase } from './components/KnowledgeBase';
import { Settings } from './components/Settings';
import { ResistorCalc } from './components/ResistorCalc';
import { ConversationHistory } from './components/ConversationHistory';
export default function App() {
  const {
    apiKey, setApiKey,
    geminiModel, setGeminiModel,
    selectedVoice, setSelectedVoice,
    autoSpeak, setAutoSpeak,
    useLocalWhisper, setUseLocalWhisper,
    localWhisperUrl, setLocalWhisperUrl,
    messages, tasks, setTasks,
    activeBoard, setActiveBoard,
    generatedCode, setGeneratedCode, codeFileName,
    chunks, setChunks,
    isListening, isSpeaking, isThinking,
    recognitionError, micPermission,
    toggleListening,
    sendMessage, clearChat,
    conversationHistory,
    deleteArchivedConversation,
    clearAllHistory,
    exportConversationHistory
  } = useFriday();

  const [textInput, setTextInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    sendMessage(textInput);
    setTextInput('');
  };

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-6 lg:p-8 gap-6 overflow-x-hidden">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to top right, #06b6d4, #7c3aed)' }}>
            <Bot className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight" style={{ background: 'linear-gradient(to right, #22d3ee, #e2e8f0, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                FRIDAY
              </h1>
              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
                v2.0.0 IoT Core
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Your personal hardware C++ assistant & voice console</p>
          </div>
        </div>

        {/* Status flags */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-white/5">
            <span className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-slate-400 font-mono">Gemini: {apiKey ? 'Online' : 'Offline'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-white/5">
            <span className={`w-2 h-2 rounded-full ${chunks.length > 0 ? 'bg-cyan-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-slate-400 font-mono">RAG: {chunks.length > 0 ? 'Indexed' : 'Preloaded'}</span>
          </div>
          {/* Keyboard shortcuts hint */}
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="kbd-badge">Space</span>
            <span className="text-[9px]">Voice</span>
            <span className="kbd-badge">Esc</span>
            <span className="text-[9px]">Stop</span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Left Column (Col-3) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <ArduinoPinout activeBoard={activeBoard} setActiveBoard={setActiveBoard} />
          <ResistorCalc />
        </div>

        {/* Center Column (Col-6) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Voice Orb Panel */}
          <div className="glass-panel p-5 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-20 flex gap-1 items-center text-slate-500 pointer-events-none">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono">AI Voice Synthesis</span>
            </div>

            <VoiceOrb
              isListening={isListening}
              isSpeaking={isSpeaking}
              isThinking={isThinking}
              onClick={toggleListening}
            />

            {/* Mic Status Indicator */}
            <div className="absolute top-0 left-0 p-3">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-mono ${
                micPermission === 'granted' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : micPermission === 'denied'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : micPermission === 'requesting'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                      : 'bg-slate-500/10 text-slate-500 border border-white/5'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  micPermission === 'granted' ? 'bg-emerald-500' 
                  : micPermission === 'denied' ? 'bg-red-500'
                  : micPermission === 'requesting' ? 'bg-amber-500 animate-pulse'
                  : 'bg-slate-600'
                }`} />
                Mic: {micPermission === 'granted' ? 'Ready' : micPermission === 'denied' ? 'Blocked' : micPermission === 'requesting' ? 'Requesting...' : 'Click Orb'}
              </div>
            </div>

            {recognitionError && (
              <div className="mt-4 p-3 bg-red-950/20 border border-red-500/25 rounded-lg text-xs text-red-300 max-w-md text-center leading-relaxed">
                <span className="font-semibold">{recognitionError}</span>
              </div>
            )}
          </div>

          {/* Code + Serial */}
          <ArduinoWorkspace
            code={generatedCode}
            setCode={setGeneratedCode}
            fileName={codeFileName}
            onSendMsg={sendMessage}
          />
        </div>

        {/* Right Column (Col-3) */}
        <div className="lg:col-span-3 flex flex-col gap-6">

          {/* Chat Log */}
          <div className="glass-panel p-4 flex flex-col h-[280px]">
            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Interaction Log</h2>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm mb-3">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                        {msg.role === 'user' ? 'You' : 'FRIDAY'}
                      </span>
                      {msg.timestamp && (
                        <span className="text-[8px] text-slate-600 font-mono">{msg.timestamp}</span>
                      )}
                    </div>
                    <div
                      className={`p-2.5 rounded-2xl leading-relaxed whitespace-pre-wrap select-text ${
                        msg.role === 'user'
                          ? 'bg-cyan-500/10 text-cyan-200 rounded-tr-none border border-cyan-500/20'
                          : msg.content === '...'
                            ? 'bg-white/5 text-slate-400 rounded-tl-none animate-pulse px-4'
                            : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 gap-2">
                  <Cpu className="w-6 h-6 text-slate-700 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Click the Orb or type below to prompt FRIDAY.</span>

                  <div className="grid grid-cols-1 gap-1.5 w-full mt-4">
                    <button
                      onClick={() => handleSuggestedPrompt("FRIDAY, write an ESP32 web server script to toggle a pin")}
                      disabled={isThinking}
                      className="group px-2.5 py-1.5 rounded-lg border border-white/5 bg-slate-900/40 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 hover:text-slate-300 text-left text-[10px] flex items-center justify-between transition-all"
                    >
                      <span>Write ESP32 LED Web Server C++</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
                    </button>
                    <button
                      onClick={() => handleSuggestedPrompt("FRIDAY, what resistor do I need for a 3.3V LED at 20mA?")}
                      disabled={isThinking}
                      className="group px-2.5 py-1.5 rounded-lg border border-white/5 bg-slate-900/40 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 hover:text-slate-300 text-left text-[10px] flex items-center justify-between transition-all"
                    >
                      <span>Calculate LED Resistor (3.3V / 20mA)</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
                    </button>
                    <button
                      onClick={() => handleSuggestedPrompt("FRIDAY, add tasks for building my new ESP32 MQTT weather station")}
                      disabled={isThinking}
                      className="group px-2.5 py-1.5 rounded-lg border border-white/5 bg-slate-900/40 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 hover:text-slate-300 text-left text-[10px] flex items-center justify-between transition-all"
                    >
                      <span>Generate Milestones for Weather Station</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
                    </button>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleTextSubmit} className="flex gap-2 mt-auto border-t border-white/5 pt-2 items-end">
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder={isThinking ? "FRIDAY is thinking..." : "Ask FRIDAY anything..."}
                rows={1}
                disabled={isThinking}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    // Programmatically trigger form submit
                    const form = e.currentTarget.form;
                    if (form) {
                      const event = new Event('submit', { cancelable: true, bubbles: true });
                      form.dispatchEvent(event);
                    }
                  }
                }}
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none min-h-[40px] max-h-[120px] leading-relaxed"
              />
              <button
                type="submit"
                disabled={isThinking}
                className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-300 flex items-center justify-center transition-all h-[40px] w-[40px] flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          <TaskManager tasks={tasks} setTasks={setTasks} />
          <KnowledgeBase apiKey={apiKey} chunks={chunks} setChunks={setChunks} />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto flex justify-between items-center border-t border-white/5 pt-4 text-xs text-slate-500">
        <span>© 2026 FRIDAY IoT Platform. Powered by Gemma.</span>
        <div className="flex gap-3 relative">
          <ConversationHistory
            conversationHistory={conversationHistory}
            deleteArchivedConversation={deleteArchivedConversation}
            clearAllHistory={clearAllHistory}
            exportConversationHistory={exportConversationHistory}
          />
          <Settings
            apiKey={apiKey}
            setApiKey={setApiKey}
            geminiModel={geminiModel}
            setGeminiModel={setGeminiModel}
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            autoSpeak={autoSpeak}
            setAutoSpeak={setAutoSpeak}
            onClearChat={clearChat}
            useLocalWhisper={useLocalWhisper}
            setUseLocalWhisper={setUseLocalWhisper}
            localWhisperUrl={localWhisperUrl}
            setLocalWhisperUrl={setLocalWhisperUrl}
          />
        </div>
      </footer>
    </div>
  );
}
