import React, { useState, useEffect, useRef } from 'react';
import { Code, Terminal, Copy, Download, Play, Square, Send, Info, Check } from 'lucide-react';

interface ArduinoWorkspaceProps {
  code: string;
  fileName: string;
  onSendMsg: (text: string) => void;
  setCode?: (code: string) => void;
}

export const ArduinoWorkspace: React.FC<ArduinoWorkspaceProps> = ({ code, fileName, onSendMsg, setCode }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'serial'>('code');
  const [copied, setCopied] = useState(false);
  
  // Serial Monitor States
  const [serialLogs, setSerialLogs] = useState<string[]>([
    '[SYSTEM] Serial Monitor initialized at 115200 baud.',
    '[SYSTEM] Waiting for device feed...'
  ]);
  const [isFeedActive, setIsFeedActive] = useState(false);
  const [manualSerialInput, setManualSerialInput] = useState('');
  
  const serialEndRef = useRef<HTMLDivElement>(null);
  const feedTimerRef = useRef<any>(null);

  // Scroll to bottom of serial logs
  useEffect(() => {
    if (serialEndRef.current) {
      serialEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs]);

  // Handle Mock Serial Feed
  useEffect(() => {
    if (isFeedActive) {
      const logs = [
        '[WIFI] Connecting to network "Home_IoT_AP"...',
        '[WIFI] Attempting connection .......',
        '[WIFI] WiFi Connected. IP: 192.168.1.134',
        '[MQTT] Connecting to broker.hivemq.com:1883...',
        '[MQTT] Broker connected. Subscribed to "home/livingroom/actuator"',
        '[DHT22] Initializing sensor...',
        '[DHT22] Read OK: Temp=23.4°C, Hum=56.2%',
        '[MQTT] Publish success on topic "home/livingroom/temp" -> 23.4',
        '[DHT22] Read OK: Temp=23.6°C, Hum=55.9%',
        '[DHT22] Read OK: Temp=24.1°C, Hum=56.0%',
        '[SYSTEM] WARNING: High CPU temperature detected!',
        '[DHT22] ERROR: Read timeout! Sensor not responding.',
        '[SYSTEM] CRITICAL: DHT22 sensor failed to report status for 10s.',
        '[MQTT] Publish failed: client disconnected.',
        '[WIFI] WARNING: Signal strength RSSI: -84dBm (Weak Connection)'
      ];
      
      let index = 0;
      feedTimerRef.current = setInterval(() => {
        if (index < logs.length) {
          setSerialLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logs[index]}`]);
          index++;
        } else {
          index = 0; // loop
        }
      }, 3000);
    } else {
      if (feedTimerRef.current) {
        clearInterval(feedTimerRef.current);
      }
    }

    return () => {
      if (feedTimerRef.current) {
        clearInterval(feedTimerRef.current);
      }
    };
  }, [isFeedActive]);

  // Copy code handler
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .ino file handler
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Send Serial Logs to FRIDAY
  const sendLogsToFriday = () => {
    const lastLogs = serialLogs.slice(-6).join('\n');
    const promptText = `FRIDAY, please analyze these serial logs from my Arduino device and diagnose any errors or issues:\n\`\`\`\n${lastLogs}\n\`\`\``;
    onSendMsg(promptText);
  };

  // Submit manual serial command
  const handleSerialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSerialInput.trim()) return;
    
    setSerialLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [USER_DEV] ${manualSerialInput}`]);
    setManualSerialInput('');
  };

  return (
    <div className="glass-panel flex flex-col h-[520px] overflow-hidden">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-slate-950/20 px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
              activeTab === 'code'
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                : 'bg-transparent text-slate-400 border-transparent hover:bg-white/5'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            C++ Sketch
          </button>
          <button
            onClick={() => setActiveTab('serial')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
              activeTab === 'serial'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-transparent text-slate-400 border-transparent hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Serial Monitor
          </button>
        </div>

        {/* Tab actions */}
        {activeTab === 'code' ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-white/5 px-2 py-0.5 rounded">
              {fileName}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-white/10 transition-all"
              title="Copy Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-white/10 transition-all"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFeedActive(!isFeedActive)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all uppercase ${
                isFeedActive 
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {isFeedActive ? (
                <>
                  <Square className="w-3 h-3 fill-current" /> Pause Feed
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" /> Start Feed
                </>
              )}
            </button>
            <button
              onClick={() => setSerialLogs(['[SYSTEM] Serial Monitor cleared.'])}
              className="px-2 py-1 rounded border border-white/5 text-[10px] text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 transition-all"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-auto flex flex-col relative">
        {activeTab === 'code' ? (
          <textarea
            value={code}
            onChange={e => setCode && setCode(e.target.value)}
            className="flex-1 p-4 arduino-code select-text overflow-auto font-mono text-sm leading-relaxed border-none focus:outline-none resize-none bg-slate-950 text-slate-300 h-full w-full"
            spellCheck="false"
          />
        ) : (
          <div className="flex-1 flex flex-col bg-slate-950 p-3 font-mono text-xs text-amber-500 overflow-hidden">
            {/* Log display */}
            <div className="flex-1 overflow-y-auto space-y-1 mb-2 pr-1 select-text">
              {serialLogs.map((log, i) => {
                let colorClass = 'text-amber-500/90';
                if (log.includes('[SYSTEM]')) colorClass = 'text-cyan-400';
                if (log.includes('[WIFI]')) colorClass = 'text-purple-400';
                if (log.includes('WARNING')) colorClass = 'text-yellow-300 font-bold';
                if (log.includes('ERROR') || log.includes('CRITICAL')) colorClass = 'text-red-400 font-bold glow-cyan';
                
                return (
                  <div key={i} className={`${colorClass} whitespace-pre-wrap leading-normal`}>
                    {log}
                  </div>
                );
              })}
              <div ref={serialEndRef} />
            </div>

            {/* Quick Diagnostic Tooltip Banner */}
            {serialLogs.some(l => l.includes('ERROR') || l.includes('CRITICAL')) && (
              <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-950/20 text-[11px] text-red-300 flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
                  FRIDAY detected an error feed. Let her diagnose it!
                </span>
                <button
                  onClick={sendLogsToFriday}
                  className="px-2 py-0.5 rounded bg-red-500/30 hover:bg-red-500/40 border border-red-500/40 text-red-200 transition-all font-bold font-sans uppercase"
                >
                  Analyze with FRIDAY
                </button>
              </div>
            )}

            {/* Serial Command Input */}
            <form onSubmit={handleSerialSubmit} className="flex gap-2 pt-2 border-t border-white/5">
              <input
                type="text"
                value={manualSerialInput}
                onChange={e => setManualSerialInput(e.target.value)}
                placeholder="Type mock serial command or feed (e.g. ESP_ERROR)..."
                className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 text-amber-300 flex items-center justify-center transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
