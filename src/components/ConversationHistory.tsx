import React, { useState } from 'react';
import { History, ChevronDown, ChevronRight, Trash2, Download, X, MessageSquare } from 'lucide-react';
import type { ArchivedConversation } from '../hooks/useFriday';

interface ConversationHistoryProps {
  conversationHistory: ArchivedConversation[];
  deleteArchivedConversation: (id: string) => void;
  clearAllHistory: () => void;
  exportConversationHistory: () => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  conversationHistory,
  deleteArchivedConversation,
  clearAllHistory,
  exportConversationHistory
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:border-purple-400 text-slate-400 hover:text-purple-300 transition-all flex items-center gap-1.5 text-xs font-semibold relative"
      >
        <History className="w-4 h-4" />
        History
        {conversationHistory.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-purple-500 text-[9px] text-white flex items-center justify-center font-bold">
            {conversationHistory.length > 9 ? '9+' : conversationHistory.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="absolute bottom-12 right-0 z-50 w-96 max-h-[70vh] p-5 rounded-2xl border border-white/10 bg-slate-950/95 backdrop-filter blur-xl shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-slate-200">Conversation History</h3>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {conversationHistory.length} saved
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-500 hover:text-slate-300 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      {conversationHistory.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={exportConversationHistory}
            className="flex-1 py-1.5 px-2 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-300 text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-3 h-3" />
            Export All as JSON
          </button>
          <button
            onClick={() => {
              if (confirm('Delete ALL archived conversations? This cannot be undone.')) {
                clearAllHistory();
              }
            }}
            className="py-1.5 px-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[10px] font-semibold flex items-center justify-center gap-1 transition-all"
          >
            <Trash2 className="w-3 h-3" />
            Clear All
          </button>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: '45vh' }}>
        {conversationHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
            <MessageSquare className="w-6 h-6 text-slate-700" />
            <span className="text-xs text-center">No archived conversations yet.<br />Conversations are saved when you clear the chat.</span>
          </div>
        ) : (
          conversationHistory.map((conv) => (
            <div
              key={conv.id}
              className="rounded-xl border border-white/5 bg-slate-900/50 overflow-hidden transition-all hover:border-white/10"
            >
              {/* Conversation Header */}
              <button
                onClick={() => setExpandedId(expandedId === conv.id ? null : conv.id)}
                className="w-full px-3 py-2.5 flex items-center gap-2 text-left hover:bg-white/5 transition-all"
              >
                {expandedId === conv.id ? (
                  <ChevronDown className="w-3 h-3 text-purple-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-500 font-mono mb-0.5">
                    {conv.archivedAt} · {conv.messageCount} messages
                  </div>
                  <div className="text-xs text-slate-300 truncate">
                    {conv.preview}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteArchivedConversation(conv.id);
                  }}
                  className="p-1 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
                  title="Delete this conversation"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>

              {/* Expanded Messages */}
              {expandedId === conv.id && (
                <div className="border-t border-white/5 px-3 py-2 space-y-2 max-h-60 overflow-y-auto bg-slate-950/50">
                  {conv.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-0.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-slate-600 uppercase tracking-widest font-mono">
                          {msg.role === 'user' ? 'You' : 'FRIDAY'}
                        </span>
                        {msg.timestamp && (
                          <span className="text-[7px] text-slate-700 font-mono">{msg.timestamp}</span>
                        )}
                        {msg.isSpeech && (
                          <span className="text-[7px] text-amber-600 font-mono">🎤</span>
                        )}
                      </div>
                      <div
                        className={`px-2 py-1.5 rounded-lg text-[10px] leading-relaxed max-w-[90%] ${
                          msg.role === 'user'
                            ? 'bg-cyan-500/5 text-cyan-300/80 border border-cyan-500/10'
                            : 'bg-white/3 text-slate-400 border border-white/5'
                        }`}
                      >
                        {msg.content.length > 200
                          ? msg.content.substring(0, 200) + '...'
                          : msg.content
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
