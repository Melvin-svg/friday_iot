import React from 'react';
import { Mic, Volume2, Loader } from 'lucide-react';

interface VoiceOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  onClick: () => void;
  compact?: boolean;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ isListening, isSpeaking, isThinking, onClick, compact = false }) => {
  let stateClass = 'orb-state-idle';
  let orbColor1 = '#06b6d4';
  let orbColor2 = '#8b5cf6';
  let orbGlow = 'rgba(6, 182, 212, 0.4)';

  if (isListening) {
    stateClass = 'orb-state-listening';
    orbColor1 = '#f59e0b';
    orbColor2 = '#ef4444';
    orbGlow = 'rgba(245, 158, 11, 0.7)';
  } else if (isThinking) {
    stateClass = 'orb-state-thinking';
    orbColor1 = '#f59e0b';
    orbColor2 = '#06b6d4';
    orbGlow = 'rgba(245, 158, 11, 0.5)';
  } else if (isSpeaking) {
    stateClass = 'orb-state-speaking';
    orbColor1 = '#8b5cf6';
    orbColor2 = '#ec4899';
    orbGlow = 'rgba(139, 92, 246, 0.7)';
  }

  if (compact) {
    return (
      <div className="relative flex items-center justify-center">
        {/* Background Outer Ring */}
        <div
          className="absolute w-20 h-20 rounded-full border border-dashed opacity-25 pulse-ring-slow"
          style={{ borderColor: orbColor1 }}
        />

        {/* Orb Clickable Container */}
        <button
          onClick={onClick}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center cursor-pointer focus:outline-none transition-all duration-500 hover:scale-105 ${stateClass}`}
          style={{
            background: `radial-gradient(circle, ${orbColor1}dd 0%, ${orbColor2}99 100%)`,
            boxShadow: `0 0 20px 4px ${orbGlow}`,
            border: '1.5px solid rgba(255, 255, 255, 0.2)'
          }}
          title={isListening ? 'Click to stop listening' : 'Click to speak to FRIDAY'}
        >
          {/* Animated Inner SVG Waves */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="url(#orbGrad)"
              strokeWidth="1"
              strokeDasharray="4 8"
              className="animate-spin"
              style={{ animationDuration: '20s' }}
            />
            <circle
              cx="50" cy="50" r="36"
              fill="none"
              stroke="url(#orbGrad)"
              strokeWidth="1.5"
              strokeDasharray="10 5"
              className="animate-spin"
              style={{ animationDuration: '10s', animationDirection: 'reverse' }}
            />
            <defs>
              <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={orbColor1} />
                <stop offset="100%" stopColor={orbColor2} />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Icons */}
          <div className="z-10 text-white flex flex-col items-center justify-center" style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))' }}>
            {isListening ? (
              <Mic className="w-5 h-5 animate-pulse text-amber-300" />
            ) : isThinking ? (
              <Loader className="w-5 h-5 animate-spin text-amber-300" />
            ) : isSpeaking ? (
              <Volume2 className="w-5 h-5 animate-bounce text-purple-200" />
            ) : (
              <Mic className="w-5 h-5 text-cyan-100" />
            )}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 relative">
      {/* Background Outer Ring */}
      <div
        className="absolute w-72 h-72 rounded-full border border-dashed opacity-25 pulse-ring-slow"
        style={{ borderColor: orbColor1 }}
      />

      {/* Orb Clickable Container */}
      <button
        onClick={onClick}
        className={`relative w-48 h-48 rounded-full flex items-center justify-center cursor-pointer focus:outline-none transition-all duration-500 hover:scale-105 ${stateClass}`}
        style={{
          background: `radial-gradient(circle, ${orbColor1}dd 0%, ${orbColor2}99 100%)`,
          boxShadow: `0 0 50px 10px ${orbGlow}`,
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}
        title={isListening ? 'Click to stop listening' : 'Click to speak to FRIDAY'}
      >
        {/* Animated Inner SVG Waves */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="url(#orbGrad)"
            strokeWidth="0.5"
            strokeDasharray="4 8"
            className="animate-spin"
            style={{ animationDuration: '20s' }}
          />
          <circle
            cx="50" cy="50" r="36"
            fill="none"
            stroke="url(#orbGrad)"
            strokeWidth="1"
            strokeDasharray="10 5"
            className="animate-spin"
            style={{ animationDuration: '10s', animationDirection: 'reverse' }}
          />
          <defs>
            <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={orbColor1} />
              <stop offset="100%" stopColor={orbColor2} />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Icons */}
        <div className="z-10 text-white flex flex-col items-center gap-2" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>
          {isListening ? (
            <>
              <Mic className="w-12 h-12 animate-pulse text-amber-300" />
              <span className="text-xs font-bold tracking-widest text-amber-200 uppercase">Recording</span>
            </>
          ) : isThinking ? (
            <>
              <Loader className="w-12 h-12 animate-spin text-amber-300" />
              <span className="text-xs font-bold tracking-widest text-amber-200 uppercase animate-pulse">Thinking</span>
            </>
          ) : isSpeaking ? (
            <>
              <Volume2 className="w-12 h-12 animate-bounce text-purple-200" />
              <span className="text-xs font-bold tracking-widest text-purple-200 uppercase animate-pulse">FRIDAY</span>
            </>
          ) : (
            <>
              <Mic className="w-12 h-12 text-cyan-100" />
              <span className="text-xs font-medium tracking-widest text-cyan-200 uppercase">Click to Speak</span>
            </>
          )}
        </div>
      </button>

      {/* Visual Audio Wave Lines under Orb */}
      <div className="h-10 mt-6 flex items-center gap-1.5 justify-center">
        {isListening ? (
          <div className="text-amber-400 text-sm font-medium animate-pulse font-mono">
            🔴 Recording... click to stop
          </div>
        ) : isThinking ? (
          <div className="text-amber-300 text-sm font-medium animate-pulse font-mono">
            Transcribing & thinking...
          </div>
        ) : isSpeaking ? (
          <div className="flex items-end gap-1 h-8">
            <span className="voice-wave-bar" style={{ animationDelay: '0.1s' }}></span>
            <span className="voice-wave-bar" style={{ animationDelay: '0.3s' }}></span>
            <span className="voice-wave-bar" style={{ animationDelay: '0.5s' }}></span>
            <span className="voice-wave-bar" style={{ animationDelay: '0.2s' }}></span>
            <span className="voice-wave-bar" style={{ animationDelay: '0.4s' }}></span>
          </div>
        ) : (
          <div className="text-cyan-400 text-sm font-medium opacity-80 font-mono tracking-wide">
            FRIDAY is Online &amp; Ready
            <span className="kbd-badge ml-auto" style={{ marginLeft: '8px' }}>Space</span>
          </div>
        )}
      </div>
    </div>
  );
};
