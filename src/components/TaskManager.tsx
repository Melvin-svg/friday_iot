import React, { useState } from 'react';
import { ListTodo, CheckSquare, Square, Trash2, Plus, AlertCircle } from 'lucide-react';
import type { Task } from '../hooks/useFriday';

interface TaskManagerProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ tasks, setTasks }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: 'task_' + Math.random().toString(36).substr(2, 9),
      text: newTaskText,
      completed: false,
      priority: newTaskPriority,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskText('');
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="glass-panel p-5 flex flex-col gap-4 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold tracking-wide">Milestones & Tasks</h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-white/5 text-slate-400 rounded-full">
          {completedCount}/{tasks.length} Completed
        </span>
      </div>

      {/* Manual Task Add Form */}
      <form onSubmit={handleAddTask} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
            placeholder="Add new task or milestone..."
            className="flex-1 bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 transition-all flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {/* Priority select */}
        <div className="flex items-center gap-2 justify-end">
          <span className="text-[10px] text-slate-500">Priority:</span>
          {(['low', 'medium', 'high'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setNewTaskPriority(p)}
              className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border transition-all ${
                newTaskPriority === p
                  ? p === 'high' 
                    ? 'bg-red-500/20 text-red-300 border-red-500/50' 
                    : p === 'medium'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-transparent text-slate-500 border-transparent hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </form>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-[160px] max-h-[300px]">
        {tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all hover:bg-white/5 ${
                  task.completed 
                    ? 'border-white/5 bg-slate-950/20 opacity-55' 
                    : 'border-white/10 bg-slate-900/10'
                }`}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs block break-words ${task.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}`}>
                      {task.text}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      Added at {task.createdAt}
                    </span>
                  </div>
                </div>
                
                {/* Priority & Delete buttons */}
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-slate-500 border border-dashed border-white/5 rounded-xl">
            <AlertCircle className="w-5 h-5 text-slate-600 mb-1.5" />
            <span>No active tasks or milestones.</span>
            <span className="opacity-70 mt-1 block">Say "FRIDAY, add a task to program my ESP32" to see them here!</span>
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="text-[10px] text-slate-500 text-center leading-normal border-t border-white/5 pt-3">
        💡 <span className="font-semibold text-slate-400">Agentic Command:</span> FRIDAY can read, prioritize, check off, and delete these milestones verbally during your conversation.
      </div>
    </div>
  );
};
