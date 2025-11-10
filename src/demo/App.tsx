import { useMemo } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';

import { TaskMaprProvider } from '../contexts/TaskMaprContext';
import { SelfContainedOverlay } from '../components/SelfContainedOverlay';
import { Message } from '../types';

import { useTaskMaprClientInstance } from '../hooks/useTaskMaprClientInstance';
import { getMockAssistantResponse } from './mockBackend';
import { DashboardPage } from './pages/Dashboard';
import { TasksPage } from './pages/Tasks';
import { TeamPage } from './pages/Team';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/team', label: 'Team' },
];

export default function App() {
  const initialMessages = useMemo<Message[]>(
    () => [
      {
        id: 'mock-welcome',
        role: 'assistant',
        content: [
          '👋 Welcome to the TaskMapr demo workspace!',
          '',
          'Ask about the dashboard metrics, the task list, or who is on the team and I will highlight the right views for you.',
        ].join('\n'),
        timestamp: new Date(),
      },
    ],
    [],
  );

  const { client: taskMaprClient } = useTaskMaprClientInstance({
    options: {
      mockMode: true,
      initialMessages,
      overlay: {
        title: 'TaskMapr Demo Assistant',
        placeholder: 'e.g. “Show me blocked tasks”',
        showTimestamps: true,
        enableHighlighting: true,
      },
      mockResponseHandler: getMockAssistantResponse,
    },
  });

  return (
    <TaskMaprProvider client={taskMaprClient}>
      <div className="demo-shell">
        <header className="demo-header">
          <div className="demo-header__brand">
            <span className="demo-header__logo">🗺️</span>
            <div>
              <p className="demo-header__title">TaskMapr Sample Workspace</p>
              <p className="demo-header__subtitle">Explore how TaskMapr guides users through your UI</p>
            </div>
          </div>
          <nav className="demo-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `demo-nav__link ${isActive ? 'demo-nav__link--active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="demo-main" id="demo-main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        <footer className="demo-footer">
          <p>
            This sandbox uses a mock backend so you can test TaskMapr flows without deploying an agent.
          </p>
        </footer>
      </div>

      <SelfContainedOverlay />
    </TaskMaprProvider>
  );
}
