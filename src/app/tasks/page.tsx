'use client';

/**
 * Tasks Page - Task Management Interface
 * Shows active tasks with step-by-step instructions
 *
 * Task 8.3: Task management interface
 * Requirements: 4.4, 5.1, 5.2
 */

import { useState, useMemo } from 'react';
import BottomNav from '@/components/navigation/BottomNav';
import { useTasks } from '@/hooks/use-tasks';
import type { Task } from '@/types/models';

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

const statusConfig = {
  assigned: { badge: 'badge-warning', label: 'New', icon: '🆕' },
  in_progress: { badge: 'badge-info', label: 'In Progress', icon: '🔄' },
  completed: { badge: 'badge-success', label: 'Completed', icon: '✅' },
  failed: { badge: 'badge-danger', label: 'Failed', icon: '❌' },
};

export default function TasksPage() {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const { tasks: allTasks, isLoading, isError, startTask } = useTasks();

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) =>
      activeTab === 'active'
        ? t.status === 'assigned' || t.status === 'in_progress'
        : t.status === 'completed' || t.status === 'failed'
    );
  }, [allTasks, activeTab]);

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
    <div className="page-container gradient-mesh">
      {/* Header */}
      <header className="p-4 pt-12">
        <h1 className="text-xl font-bold">My Tasks</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Complete tasks to earn money
        </p>
      </header>

      {/* Tab Switcher */}
      <div className="px-4 pb-3">
        <div className="flex rounded-xl overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
          <button
            id="tab-active"
            className={`flex-1 py-3 text-sm font-semibold transition-all ${
              activeTab === 'active' ? 'gradient-primary text-white' : ''
            }`}
            style={activeTab !== 'active' ? { color: 'var(--text-muted)' } : {}}
            onClick={() => setActiveTab('active')}
          >
            Active ({allTasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress').length})
          </button>
          <button
            id="tab-completed"
            className={`flex-1 py-3 text-sm font-semibold transition-all ${
              activeTab === 'completed' ? 'gradient-primary text-white' : ''
            }`}
            style={activeTab !== 'completed' ? { color: 'var(--text-muted)' } : {}}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({allTasks.filter((t) => t.status === 'completed' || t.status === 'failed').length})
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3 pt-4">
            <div className="skeleton h-24 w-full" style={{ borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton h-24 w-full" style={{ borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton h-24 w-full" style={{ borderRadius: 'var(--radius-md)' }} />
          </div>
        ) : isError ? (
          <div className="glass-card p-8 text-center text-red-400 font-bold">
            Failed to load tasks
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="glass-card p-8 text-center animate-fadeInUp">
            <span className="text-4xl">📭</span>
            <p className="font-semibold mt-3">No tasks here</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {activeTab === 'active'
                ? 'Scan your shelf to get new tasks!'
                : 'Completed tasks will appear here'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task, index) => {
            const config = statusConfig[task.status];
            const isExpanded = expandedTask === task.id;

            return (
              <div
                key={task.id}
                className={`glass-card overflow-hidden animate-fadeInUp`}
                style={{ animationDelay: `${index * 0.1}s` }}
                id={`task-card-${task.id}`}
              >
                {/* Task Header */}
                <button
                  className="w-full p-4 flex items-center justify-between text-left"
                  onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  id={`task-toggle-${task.id}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{task.instructions?.productName || 'Product'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {task.instructions?.brandName || 'Brand'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: 'var(--accent-green)' }}>
                      ₹{task.earnings}
                    </p>
                    <span className={`badge ${config.badge} mt-1`}>
                      {config.label}
                    </span>
                  </div>
                </button>

                {/* Expanded Instructions */}
                {isExpanded && task.instructions && (
                  <div className="px-4 pb-4 animate-fadeInUp"
                       style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold mt-3 mb-2"
                       style={{ color: 'var(--text-secondary)' }}>
                      INSTRUCTIONS
                    </p>
                    <ol className="space-y-2">
                      {[
                        `Find empty space on ${task.instructions.targetLocation?.shelfLevel ? 'shelf level ' + task.instructions.targetLocation.shelfLevel : 'the shelf'}`,
                        ...(task.instructions.positioningRules || []),
                        ...(task.instructions.visualRequirements || []),
                        'Snap a clear proof photo'
                      ].map((step, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                                style={{ background: 'rgba(108, 99, 255, 0.15)', color: 'var(--primary-light)' }}>
                            {i + 1}
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>{step}</span>
                        </li>
                      ))}
                    </ol>

                    <div className="flex gap-3 mt-4">
                      {task.status === 'assigned' && (
                        <button 
                          className="btn btn-primary flex-1 text-sm" 
                          id={`btn-start-${task.id}`}
                          onClick={() => handleStartTask(task.id)}
                        >
                          ▶️ Start Task
                        </button>
                       )}
                      {task.status === 'in_progress' && (
                        <button 
                          className="btn btn-success flex-1 text-sm" 
                          id={`btn-complete-${task.id}`}
                          onClick={() => window.location.href = `/camera?taskId=${task.id}`}
                        >
                          📷 Upload Proof
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-center mt-3"
                       style={{ color: 'var(--accent-yellow)' }}>
                      ⏰ {formatTimeRemaining(task)}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
