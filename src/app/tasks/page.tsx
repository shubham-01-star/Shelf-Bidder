'use client';

/**
 * Tasks Page - Task Management Interface
 * Shows active tasks with step-by-step instructions
 *
 * Task 8.3: Task management interface
 * Requirements: 4.4, 5.1, 5.2
 */

import { useState } from 'react';
import BottomNav from '@/components/navigation/BottomNav';

interface TaskItem {
  id: string;
  productName: string;
  brandName: string;
  earnings: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'failed';
  timeRemaining: string;
  instructions: string[];
}

const mockTasks: TaskItem[] = [
  {
    id: 'task-1',
    productName: 'Pepsi 500ml',
    brandName: 'PepsiCo',
    earnings: 75,
    status: 'assigned',
    timeRemaining: '22h left',
    instructions: [
      'Find the empty space on shelf level 2',
      'Place Pepsi 500ml bottle with label facing forward',
      'Ensure product is stable and visible',
      'Take a proof photo when done',
    ],
  },
  {
    id: 'task-2',
    productName: 'Lay\'s Classic',
    brandName: 'Frito-Lay',
    earnings: 50,
    status: 'in_progress',
    timeRemaining: '18h left',
    instructions: [
      'Place at eye level on shelf 3',
      'Keep the product bag standing upright',
      'Brand logo must be visible from 2 meters',
      'Snap a clear proof photo',
    ],
  },
  {
    id: 'task-3',
    productName: 'Coca-Cola 300ml',
    brandName: 'Coca-Cola',
    earnings: 60,
    status: 'completed',
    timeRemaining: 'Done',
    instructions: [],
  },
];

const statusConfig = {
  assigned: { badge: 'badge-warning', label: 'New', icon: '🆕' },
  in_progress: { badge: 'badge-info', label: 'In Progress', icon: '🔄' },
  completed: { badge: 'badge-success', label: 'Completed', icon: '✅' },
  failed: { badge: 'badge-danger', label: 'Failed', icon: '❌' },
};

export default function TasksPage() {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const filteredTasks = mockTasks.filter((t) =>
    activeTab === 'active'
      ? t.status === 'assigned' || t.status === 'in_progress'
      : t.status === 'completed' || t.status === 'failed'
  );

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
            Active ({mockTasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress').length})
          </button>
          <button
            id="tab-completed"
            className={`flex-1 py-3 text-sm font-semibold transition-all ${
              activeTab === 'completed' ? 'gradient-primary text-white' : ''
            }`}
            style={activeTab !== 'completed' ? { color: 'var(--text-muted)' } : {}}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({mockTasks.filter((t) => t.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="px-4 space-y-3">
        {filteredTasks.length === 0 ? (
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
                      <p className="font-semibold text-sm">{task.productName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {task.brandName}
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
                {isExpanded && task.instructions.length > 0 && (
                  <div className="px-4 pb-4 animate-fadeInUp"
                       style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold mt-3 mb-2"
                       style={{ color: 'var(--text-secondary)' }}>
                      INSTRUCTIONS
                    </p>
                    <ol className="space-y-2">
                      {task.instructions.map((step, i) => (
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
                        <button className="btn btn-primary flex-1 text-sm" id={`btn-start-${task.id}`}>
                          ▶️ Start Task
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button className="btn btn-success flex-1 text-sm" id={`btn-complete-${task.id}`}>
                          📷 Upload Proof
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-center mt-3"
                       style={{ color: 'var(--accent-yellow)' }}>
                      ⏰ {task.timeRemaining}
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
