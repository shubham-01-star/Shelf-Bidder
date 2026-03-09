'use client';

/**
 * Tasks Page - Task Management Interface
 * Shows active tasks with step-by-step instructions
 *
 * Task 8.3: Task management interface
 * Requirements: 4.4, 5.1, 5.2
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/navigation/BottomNav';
import { useTasks } from '@/hooks/use-tasks';
import type { Task } from '@/types/models';
import { PackageSearch, Bell, Camera, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Play, Check } from 'lucide-react';

// Helper to format remaining time
function formatTimeRemaining(task: Task): string {
  if (task.status === 'completed') return 'Done';
  if (task.status === 'failed') return 'Failed';
  
  if (!task.instructions?.timeLimit) return 'No limit';
  
  const assigned = new Date(task.assignedDate).getTime();
  const limitMs = task.instructions.timeLimit * 60 * 60 * 1000;
  const now = Date.now();
  const remaining = assigned + limitMs - now;
  
  if (remaining <= 0) return 'Overdue';
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  if (hours > 0) return `${hours}h left`;
  const minutes = Math.floor(remaining / (1000 * 60));
  return `${minutes}m left`;
}

export default function TasksPage() {
  const router = useRouter();
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const { tasks: allTasks, isLoading, isError, startTask } = useTasks();

  const activeTasks = useMemo(() => allTasks.filter(t => t.status === 'assigned' || t.status === 'in_progress' || t.status === 'failed'), [allTasks]);
  const completedTasks = useMemo(() => allTasks.filter(t => t.status === 'completed'), [allTasks]);

  const filteredTasks = activeTab === 'active' ? activeTasks : completedTasks;

  const handleStartTask = async (taskId: string) => {
    try {
      await startTask(taskId);
      alert('Task started! Get to work on the shelf.');
    } catch (error) {
      alert('Failed to start task.');
      console.error(error);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark font-sans text-[#1a1c1e] antialiased">
      {/* Header */}
      <div className="flex items-center p-6 pb-4 justify-between bg-white sticky top-0 z-30 shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <PackageSearch className="w-8 h-8 text-slate-700" />
          <h1 className="text-2xl font-black tracking-tight text-[#1a1c1e]">My Tasks</h1>
        </div>
        <button className="flex items-center justify-center size-10 rounded-full bg-slate-100 text-slate-600 active:scale-95 transition-transform">
          <Bell className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 sticky top-[76px] z-20 shadow-sm">
        <div className="flex border-b border-slate-100">
          <button 
            className={`flex flex-col items-center justify-center border-b-[3px] flex-1 pb-4 pt-4 transition-colors ${
              activeTab === 'active' ? 'border-[#11d452] text-[#1a1c1e]' : 'border-transparent text-slate-400'
            }`}
            onClick={() => setActiveTab('active')}
          >
            <p className="text-[17px] font-black">Active</p>
          </button>
          <button 
            className={`flex flex-col items-center justify-center border-b-[3px] flex-1 pb-4 pt-4 transition-colors ${
              activeTab === 'completed' ? 'border-[#11d452] text-[#1a1c1e]' : 'border-transparent text-slate-400'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            <p className="text-[17px] font-black">Completed</p>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6 p-4 pt-6 pb-32">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>
            <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-100 p-8 text-center rounded-2xl">
             <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
             <p className="text-red-700 font-bold">Failed to load tasks</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-[1.5rem] shadow-sm border border-slate-100 mt-4 animate-fadeInUp">
            <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <PackageSearch className="w-10 h-10 text-slate-300" />
            </div>
            <p className="font-bold text-lg text-slate-800">No {activeTab} tasks</p>
            <p className="text-sm mt-1 font-medium text-slate-500">
              {activeTab === 'active'
                ? "You're all caught up! Scan a shelf to find new opportunities."
                : 'Your finished tasks will appear here.'}
            </p>
          </div>
        ) : (
          <>
            {/* Section Header */}
            <div className="flex items-center justify-between px-2 animate-fadeInUp">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                {activeTab === 'active' ? 'To Do Now' : 'Recently Done'}
              </h3>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                activeTab === 'active' ? 'bg-[#11d452]/20 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {filteredTasks.length} Task{filteredTasks.length !== 1 && 's'}
              </span>
            </div>

            {filteredTasks.map((task, index) => {
              const isExpanded = expandedTask === task.id;

              if (activeTab === 'active') {
                return (
                  <div key={task.id} className="flex flex-col rounded-[1.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.06)] bg-white overflow-hidden border border-slate-100 animate-fadeInUp transition-all" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div 
                      className="w-full h-40 bg-center bg-cover bg-slate-100 relative cursor-pointer"
                      onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                      style={{ 
                        backgroundImage: `url(${(task.instructions?.targetLocation as any)?.image || 'https://images.unsplash.com/photo-1601598851547-4302969d0614?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'})` 
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-black tracking-wider uppercase rounded-lg shadow-sm">
                          {formatTimeRemaining(task)}
                        </span>
                        <div className="size-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                           {isExpanded ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col p-6 gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[22px] font-black leading-tight text-[#1a1c1e]">{task.instructions?.productName || 'Product Verification'}</p>
                          <p className="text-lg font-black text-[#11d452] mt-1">Reward: ₹{task.earnings}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           {task.status === 'assigned' ? (
                              <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-[11px] font-black uppercase tracking-wider rounded-lg border border-amber-200 shadow-sm whitespace-nowrap">
                                New Task
                              </span>
                           ) : task.status === 'failed' ? (
                              <span className="px-3 py-1.5 bg-red-100 text-red-700 text-[11px] font-black uppercase tracking-wider rounded-lg border border-red-200 shadow-sm whitespace-nowrap">
                                Failed - Retry
                              </span>
                           ) : (
                              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-[11px] font-black uppercase tracking-wider rounded-lg border border-blue-200 shadow-sm whitespace-nowrap">
                                In Progress
                              </span>
                           )}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && task.instructions && (
                        <div className="mt-2 pt-4 border-t border-slate-100 animate-fadeInUp">
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Instructions</p>
                           <ol className="space-y-4">
                              {[
                                `Find space on ${task.instructions.targetLocation?.shelfLevel ? 'Level ' + task.instructions.targetLocation.shelfLevel : 'the shelf'}`,
                                ...(task.instructions.positioningRules || []),
                                ...(task.instructions.visualRequirements || []),
                                'Take a clear photo for proof'
                              ].map((step, i) => (
                                <li key={i} className="flex gap-4 text-sm items-start">
                                  <span className="size-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black bg-[#11d452]/20 text-emerald-800 shadow-sm mt-0.5">
                                    {i + 1}
                                  </span>
                                  <span className="text-slate-600 font-bold leading-relaxed pt-1">{step}</span>
                                </li>
                              ))}
                           </ol>
                        </div>
                      )}
                      
                      {/* Action Button */}
                      {task.status === 'assigned' ? (
                        <button 
                          onClick={() => handleStartTask(task.id)}
                          className="flex w-full mt-2 cursor-pointer items-center justify-center gap-2 rounded-xl h-14 bg-text-main dark:bg-[#1a1c1e] text-white text-lg font-black shadow-lg shadow-black/20 active:scale-95 transition-transform"
                        >
                          <Play className="w-5 h-5 fill-current" />
                          <span>Start This Task</span>
                        </button>
                      ) : task.status === 'failed' ? (
                        <button 
                          onClick={() => router.push(`/camera?taskId=${task.id}`)}
                          className="flex w-full mt-2 cursor-pointer items-center justify-center gap-2 rounded-xl h-14 bg-orange-500 text-white text-lg font-black shadow-[0_8px_20px_rgba(249,115,22,0.3)] active:scale-95 transition-transform"
                        >
                          <Camera className="w-6 h-6 stroke-[2.5]" />
                          <span>Retry Task</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => router.push(`/camera?taskId=${task.id}`)}
                          className="flex w-full mt-2 cursor-pointer items-center justify-center gap-2 rounded-xl h-14 bg-[#11d452] text-[#1a1c1e] text-lg font-black shadow-[0_8px_20px_rgba(17,212,82,0.3)] active:scale-95 transition-transform"
                        >
                          <Camera className="w-6 h-6 stroke-[2.5]" />
                          <span>Upload Proof</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              } else {
                // Completed Task Row
                return (
                  <div key={task.id} className="flex items-center p-4 rounded-[1.25rem] bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] gap-4 animate-fadeInUp" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="size-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                      <div 
                        className="w-full h-full bg-center bg-cover" 
                        style={{ 
                          backgroundImage: `url(${(task.instructions?.targetLocation as any)?.image || 'https://images.unsplash.com/photo-1628102491629-77858c6734fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'})` 
                        }}
                      ></div>
                    </div>
                    
                    <div className="flex flex-col flex-1 pb-1">
                      <p className="text-lg font-black leading-tight text-[#1a1c1e] line-clamp-1">{task.instructions?.productName || 'Task'}</p>
                      <p className="text-sm font-bold text-slate-500 mt-0.5">Reward: ₹{task.earnings}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {task.status === 'completed' ? (
                           <>
                             <CheckCircle2 className="w-4 h-4 text-[#11d452]" />
                             <span className="text-xs font-black text-[#11d452] uppercase tracking-wider">Paid</span>
                           </>
                        ) : (
                           <>
                             <AlertCircle className="w-4 h-4 text-red-500" />
                             <span className="text-xs font-black text-red-500 uppercase tracking-wider">Failed</span>
                           </>
                        )}
                      </div>
                    </div>
                    
                    <div className={`flex items-center justify-center size-12 rounded-full shrink-0 ${
                       task.status === 'completed' ? 'bg-[#11d452]/10 text-[#11d452]' : 'bg-red-50 text-red-500'
                    }`}>
                      {task.status === 'completed' ? <Check className="w-6 h-6 stroke-[3]" /> : <AlertCircle className="w-6 h-6 stroke-[2.5]" />}
                    </div>
                  </div>
                );
              }
            })}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
