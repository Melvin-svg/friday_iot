import React, { useState, useRef } from 'react';
import { FolderOpen, FileText, Trash2, Upload, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import type { DocumentChunk, UploadedFile } from '../utils/rag';
import { chunkText, getEmbedding, extractTextFromPDF } from '../utils/rag';

interface KnowledgeBaseProps {
  apiKey: string;
  chunks: DocumentChunk[];
  setChunks: React.Dispatch<React.SetStateAction<DocumentChunk[]>>;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ apiKey, chunks, setChunks }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    
    if (!apiKey) {
      setUploadError('API Key is required to index files. Set it in the settings panel.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const fileId = 'file_' + Math.random().toString(36).substr(2, 9);
      
      const newFileRecord: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type || file.name.split('.').pop() || '',
        status: 'processing',
        chunksCount: 0
      };

      setFiles(prev => [newFileRecord, ...prev]);

      try {
        let extractedText = '';
        
        if (file.name.endsWith('.pdf')) {
          extractedText = await extractTextFromPDF(file);
        } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          extractedText = await file.text();
        } else {
          throw new Error('Unsupported file format. Please upload .txt, .md or .pdf files.');
        }

        if (!extractedText.trim()) {
          throw new Error('File content is empty.');
        }

        // Chunk text
        const textChunks = chunkText(extractedText);
        
        // Generate Embeddings
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

        // Add to main chunks pool
        setChunks(prev => [...prev, ...embeddedChunks]);
        
        // Update file status to ready
        setFiles(prev => prev.map(f => f.id === fileId ? { 
          ...f, 
          status: 'ready', 
          chunksCount: embeddedChunks.length 
        } : f));

      } catch (err: any) {
        console.error('File index error:', err);
        setUploadError(`Failed to index "${file.name}": ${err.message || 'Unknown error'}`);
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'error' } : f));
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteFile = (fileName: string, fileId: string) => {
    // Remove chunks related to this file using the unique fileId prefix
    setChunks(prev => prev.filter(c => !c.id.startsWith(`${fileId}_`)));
    // Remove file record
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFormatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="glass-panel p-5 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold tracking-wide">Knowledge Documents</h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-white/5 text-slate-400 rounded-full">
          {chunks.length} Chunks Indexed
        </span>
      </div>

      {/* Info Warning */}
      {!apiKey && (
        <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Gemini API Key required in settings to generate vector embeddings for your documents.</span>
        </div>
      )}

      {/* File Upload Trigger */}
      <div 
        onClick={() => apiKey && !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-all select-none ${
          !apiKey 
            ? 'opacity-40 border-white/5 cursor-not-allowed'
            : isUploading 
              ? 'border-cyan-500/30 bg-cyan-950/5 cursor-wait'
              : 'border-white/10 hover:border-cyan-500/40 hover:bg-white/5 cursor-pointer'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.md,.pdf"
          multiple
          className="hidden"
          disabled={!apiKey || isUploading}
        />
        
        {isUploading ? (
          <>
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs font-medium text-cyan-300">Reading & Embedding vectors...</span>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-slate-400" />
            <span className="text-xs font-semibold text-slate-200">Upload Knowledge Documents</span>
            <span className="text-[10px] text-slate-500">Supports PDF, TXT, or Markdown (.md)</span>
          </>
        )}
      </div>

      {/* Error banner */}
      {uploadError && (
        <div className="p-2.5 bg-red-950/25 border border-red-500/20 rounded-lg text-[11px] text-red-300 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="break-words flex-1">{uploadError}</span>
        </div>
      )}

      {/* Files List */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-[140px] max-h-[220px]">
        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map(file => (
              <div 
                key={file.id}
                className="p-2.5 rounded-lg border border-white/5 bg-slate-950/20 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className={`w-4 h-4 flex-shrink-0 ${
                    file.status === 'ready' 
                      ? 'text-cyan-400' 
                      : file.status === 'error' 
                        ? 'text-red-400' 
                        : 'text-slate-500 animate-pulse'
                  }`} />
                  <div className="min-w-0">
                    <span className="font-semibold block truncate text-slate-200" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[9px] text-slate-500 block">
                      {getFormatSize(file.size)} • {file.status === 'ready' ? `${file.chunksCount} chunks` : file.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {file.status === 'processing' && (
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  )}
                  {file.status === 'ready' && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <button
                    onClick={() => handleDeleteFile(file.name, file.id)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all"
                    disabled={file.status === 'processing'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-slate-500 border border-dashed border-white/5 rounded-xl">
            <span>No custom documentation uploaded yet.</span>
            <span className="opacity-70 mt-1 block">RAG searches automatically query uploaded files alongside preloaded Arduino cheat sheets.</span>
          </div>
        )}
      </div>
    </div>
  );
};
