import { createContext, useContext, ReactNode } from 'react';
import { TaskMaprClient } from '../types';

const TaskMaprContext = createContext<TaskMaprClient | null>(null);

export function useTaskMaprClient() {
  const context = useContext(TaskMaprContext);
  if (!context) {
    throw new Error('useTaskMaprClient must be used within TaskMaprProvider');
  }
  return context;
}

export function TaskMaprProvider({
  client,
  children,
}: {
  client: TaskMaprClient;
  children: ReactNode;
}) {
  return (
    <TaskMaprContext.Provider value={client}>
      {children}
    </TaskMaprContext.Provider>
  );
}
