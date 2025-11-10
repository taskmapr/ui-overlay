import { useEffect, useMemo, useState } from 'react';

import { TaskCard } from '../components/TaskCard';
import { useHighlightable } from '../../hooks/useHighlightable';
import { DemoTask, fetchDemoTasks } from '../mockBackend';

const TaskDetails = ({ task }: { task: DemoTask | null }) => {
  const highlightRef = useHighlightable<HTMLDivElement>({
    name: 'Task details panel',
    description: 'Shows the details for the selected task.',
    keywords: ['task', 'details', 'panel'],
    enabled: Boolean(task),
  });

  if (!task) {
    return (
      <section ref={highlightRef} className="demo-card demo-task-detail">
        <h3>Select a task to view details</h3>
        <p className="demo-muted">
          When TaskMapr highlights a card, click it to load more context here.
        </p>
      </section>
    );
  }

  return (
    <section ref={highlightRef} className="demo-card demo-task-detail" id="task-detail-panel">
      <header>
        <h2>{task.title}</h2>
        <p className="demo-muted">Owned by {task.assignee}</p>
      </header>
      <dl className="demo-task-detail__meta">
        <div>
          <dt>Status</dt>
          <dd>{task.status}</dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>{task.priority}</dd>
        </div>
        <div>
          <dt>Due date</dt>
          <dd>{new Date(task.dueDate).toLocaleDateString()}</dd>
        </div>
      </dl>
      <section>
        <h3>Summary</h3>
        <p>{task.description}</p>
      </section>
    </section>
  );
};

export const TasksPage = () => {
  const [tasks, setTasks] = useState<DemoTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchDemoTasks().then((taskData) => {
      if (!mounted) return;
      setTasks(taskData);
      setSelectedTaskId((prev) => prev ?? (taskData.length ? taskData[0].id : null));
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  return (
    <div className="demo-page" aria-labelledby="tasks-heading">
      <div className="demo-page__heading">
        <h1 id="tasks-heading">Tasks</h1>
        <p className="demo-muted">
          Use this page to track work, surface blockers, and let TaskMapr guide folks to the right card.
        </p>
      </div>

      <div className="demo-tasks-layout">
        <section id="task-list" className="demo-tasks-list">
          <header className="demo-section__header">
            <h2>Active tasks</h2>
            <span className="demo-badge">{loading ? 'Loading…' : `${tasks.length} total`}</span>
          </header>
          <div className="demo-grid demo-grid--list">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isSelected={task.id === selectedTaskId}
                onSelect={(nextTask) => setSelectedTaskId(nextTask.id)}
              />
            ))}
            {!tasks.length && !loading && <div className="demo-card demo-empty">No tasks yet.</div>}
            {loading && <div className="demo-card demo-empty">Loading tasks…</div>}
          </div>
        </section>

        <TaskDetails task={selectedTask} />
      </div>
    </div>
  );
};

