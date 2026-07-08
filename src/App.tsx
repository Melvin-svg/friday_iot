import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Trash2, Cpu, Plus } from 'lucide-react';
import { useFriday } from './hooks/useFriday';
import { VoiceOrb } from './components/VoiceOrb';
import { ArduinoPinout } from './components/ArduinoPinout';
import { ArduinoWorkspace } from './components/ArduinoWorkspace';
import { TaskManager } from './components/TaskManager';
import { KnowledgeBase } from './components/KnowledgeBase';
import { Settings } from './components/Settings';
import { ResistorCalc } from './components/ResistorCalc';
import { ConversationHistory } from './components/ConversationHistory';
import { chunkText, getEmbedding, extractTextFromPDF } from './utils/rag';
import type { DocumentChunk } from './utils/rag';
export default function App() {
  const {
    apiKey, setApiKey,
    geminiModel, setGeminiModel,
    selectedVoice, setSelectedVoice,
    autoSpeak, setAutoSpeak,
    useLocalWhisper, setUseLocalWhisper,
    localWhisperUrl, setLocalWhisperUrl,
    messages, setMessages, tasks, setTasks,
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
  const [showError, setShowError] = useState(true);
  const [leftTab, setLeftTab] = useState<'resistor' | 'knowledge'>('resistor');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (recognitionError) {
      setShowError(true);
    }
  }, [recognitionError]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    sendMessage(textInput);
    setTextInput('');
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    
    if (!apiKey) {
      const warningId = 'msg_' + Math.random().toString(36).substr(2, 9);
      setMessages(prev => [...prev, {
        id: warningId,
        role: 'model',
        content: '⚠️ Please set your Gemini API Key in settings before uploading documents.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      return;
    }

    const file = uploadedFiles[0];
    const systemMsgId = 'msg_' + Math.random().toString(36).substr(2, 9);
    
    // Add "Processing file..." system message
    setMessages(prev => [...prev, {
      id: systemMsgId,
      role: 'model',
      content: `⚙️ Processing and indexing "${file.name}" for RAG context...`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    try {
      let extractedText = '';
      if (file.name.endsWith('.pdf')) {
        extractedText = await extractTextFromPDF(file);
      } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        extractedText = await file.text();
      } else {
        throw new Error('Unsupported format. Please upload .txt, .md or .pdf.');
      }

      if (!extractedText.trim()) {
        throw new Error('File content is empty.');
      }

      const textChunks = chunkText(extractedText);
      const fileId = 'file_' + Math.random().toString(36).substr(2, 9);
      
      const embeddedChunks: DocumentChunk[] = await Promise.all(
        textChunks.map(async (text, index) => {
          const embedding = await getEmbedding(text, apiKey);
          return {
            id: `${fileId}_chunk_${index}`,
            fileName: file.name,
            text,
            embedding
          };
        })
      );

      setChunks(prev => [...prev, ...embeddedChunks]);
      
      // Update system message to success
      setMessages(prev => prev.map(m => m.id === systemMsgId ? {
        ...m,
        content: `✅ "${file.name}" successfully indexed (${embeddedChunks.length} chunks). FRIDAY now has access to this document during chat!`
      } : m));

    } catch (err: any) {
      console.error(err);
      setMessages(prev => prev.map(m => m.id === systemMsgId ? {
        ...m,
        content: `❌ Failed to index "${file.name}": ${err.message || 'Unknown error'}`
      } : m));
    }

    // Reset file input value so same file can be uploaded again
    if (docInputRef.current) docInputRef.current.value = '';
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
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* Column 1: Hardware References & Utilities (Col-4) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Box 1: Arduino Pinout Reference (Height 560px) */}
          <div className="h-[560px] flex-shrink-0 overflow-hidden">
            <ArduinoPinout activeBoard={activeBoard} setActiveBoard={setActiveBoard} />
          </div>

          {/* Box 2: Tabbed Utilities Panel (Height 180px) */}
          <div className="glass-panel flex flex-col h-[180px] overflow-hidden">
            {/* Header Tabs */}
            <div className="flex border-b border-white/5 bg-slate-950/20 px-4 py-2 justify-between items-center flex-shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setLeftTab('resistor')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    leftTab === 'resistor'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-transparent text-slate-400 border-transparent hover:bg-white/5'
                  }`}
                >
                  Resistor Calc
                </button>
                <button
                  onClick={() => setLeftTab('knowledge')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    leftTab === 'knowledge'
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      : 'bg-transparent text-slate-400 border-transparent hover:bg-white/5'
                  }`}
                >
                  Knowledge Base
                </button>
              </div>
            </div>
            
            {/* Tab Contents */}
            <div className="flex-1 overflow-auto">
              {leftTab === 'resistor' ? (
                <ResistorCalc flat={true} />
              ) : (
                <KnowledgeBase apiKey={apiKey} chunks={chunks} setChunks={setChunks} flat={true} />
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Code Editor & Serial output (Col-4) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <ArduinoWorkspace
            code={generatedCode}
            setCode={setGeneratedCode}
            fileName={codeFileName}
            onSendMsg={sendMessage}
          />
        </div>

        {/* Column 3: AI Assistant & Milestones (Col-4) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Box 5: Unified AI Assistant (Voice + Chat Log) (Height 370px) */}
          <div className="glass-panel p-4 flex flex-col h-[370px] overflow-hidden flex-shrink-0">
            {/* Header: Title + Clear Button */}
            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2 flex-shrink-0">
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

            {/* Nested Voice Core Bar */}
            <div className="flex items-center justify-between min-h-[56px] py-1 border-b border-white/5 mb-3 flex-shrink-0 relative">
              <div className="flex items-center gap-3">
                <VoiceOrb
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  isThinking={isThinking}
                  onClick={toggleListening}
                  compact={true}
                />
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Voice Core</span>
                  {isListening ? (
                    <span className="text-amber-400 text-xs font-bold animate-pulse font-mono leading-none">
                      Listening...
                    </span>
                  ) : isThinking ? (
                    <span className="text-amber-300 text-xs font-bold animate-pulse font-mono leading-none">
                      Thinking...
                    </span>
                  ) : isSpeaking ? (
                    <span className="text-purple-400 text-xs font-bold animate-pulse font-mono leading-none">
                      Speaking...
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium font-mono leading-none">
                      Idle
                    </span>
                  )}
                </div>
              </div>

              {/* Mic Status Indicator */}
              <div className="flex flex-col items-end gap-1">
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                  micPermission === 'granted' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : micPermission === 'denied'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : micPermission === 'requesting'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        : 'bg-slate-500/10 text-slate-500 border border-white/5'
                }`}>
                  <span className={`w-1 h-1 rounded-full ${
                    micPermission === 'granted' ? 'bg-emerald-500' 
                    : micPermission === 'denied' ? 'bg-red-500'
                    : micPermission === 'requesting' ? 'bg-amber-500 animate-pulse'
                    : 'bg-slate-600'
                  }`} />
                  {micPermission === 'granted' ? 'Active' : micPermission === 'denied' ? 'Blocked' : micPermission === 'requesting' ? 'Asking...' : 'Off'}
                </div>
                <span className="text-[8px] text-slate-500 font-mono">Space to Speak</span>
              </div>

              {recognitionError && showError && (
                <div className="absolute inset-0 bg-red-950/95 border border-red-500/30 flex items-center justify-between px-3 py-1 text-[10px] text-red-300 z-20">
                  <span className="font-semibold truncate pr-2" title={recognitionError}>{recognitionError}</span>
                  <button 
                    type="button"
                    onClick={() => setShowError(false)} 
                    className="text-[9px] uppercase font-bold text-red-400 hover:text-red-300 underline flex-shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Message Area */}
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
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleTextSubmit} className="flex gap-2 mt-auto border-t border-white/5 pt-2 items-end flex-shrink-0">
              <input
                type="file"
                ref={docInputRef}
                onChange={handleDocumentUpload}
                accept=".txt,.md,.pdf"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={isThinking}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 flex items-center justify-center transition-all h-[40px] w-[40px] flex-shrink-0"
                title="Add Document (.txt, .md, .pdf)"
              >
                <Plus className="w-4 h-4" />
              </button>
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder={isThinking ? "FRIDAY is thinking..." : "Ask FRIDAY anything..."}
                rows={1}
                disabled={isThinking}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
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

          {/* Box 6: Task Manager (Height 370px) */}
          <div className="h-[370px] flex-shrink-0 overflow-hidden">
            <TaskManager tasks={tasks} setTasks={setTasks} />
          </div>
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
