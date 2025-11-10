import { useEffect, useState } from 'react';

import { useHighlightable } from '../../hooks/useHighlightable';
import {
  DemoMetric,
  DemoTask,
  fetchDemoMetrics,
  fetchDemoTasks,
} from '../mockBackend';

const MetricCard = ({ metric }: { metric: DemoMetric }) => {
  const highlightRef = useHighlightable<HTMLDivElement>({
    name: `${metric.label} metric`,
    description: `Current value ${metric.value}`,
    keywords: [metric.label, 'metric'],
  });

  const changeLabel = metric.change > 0 ? 'increase' : metric.change < 0 ? 'decrease' : 'no change';
  const changeClass =
    metric.change > 0 ? 'demo-metric__change--up' : metric.change < 0 ? 'demo-metric__change--down' : '';

  return (
    <div ref={highlightRef} className="demo-card demo-metric" id={`metric-${metric.id}`}>
      <p className="demo-metric__label">{metric.label}</p>
      <p className="demo-metric__value">{metric.value}</p>
      <p className={`demo-metric__change ${changeClass}`}>
        {metric.change > 0 ? '+' : ''}
        {metric.change} {changeLabel} vs last sprint
      </p>
    </div>
  );
};

const TaskSnapshot = ({ tasks }: { tasks: DemoTask[] }) => {
  const highlightRef = useHighlightable<HTMLDivElement>({
    name: 'Task status snapshot',
    description: 'Quick view of how many tasks are in each state.',
    keywords: ['tasks', 'summary'],
  });

  const statusBuckets = tasks.reduce<Record<DemoTask['status'], number>>((acc, task) => {
    acc[task.status] += 1;
    return acc;
  }, {
    'Not Started': 0,
    'In Progress': 0,
    'Blocked': 0,
    'Done': 0,
  } as Record<DemoTask['status'], number>);

  return (
    <section ref={highlightRef} className="demo-card demo-task-snapshot">
      <header>
        <h3>Task status snapshot</h3>
        <p className="demo-muted">Track progress and blockers at a glance.</p>
      </header>
      <div className="demo-task-snapshot__grid">
        {Object.entries(statusBuckets).map(([status, count]) => (
          <div key={status} className="demo-task-snapshot__item">
            <span className="demo-task-snapshot__count">{count}</span>
            <span className="demo-task-snapshot__label">{status}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

const GuidancePanel = () => {
  const highlightRef = useHighlightable<HTMLDivElement>({
    name: 'Guided tour prompt',
    description: 'Suggested prompts to try with the TaskMapr assistant.',
    keywords: ['assistant', 'help'],
  });

  return (
    <section ref={highlightRef} className="demo-card demo-guidance">
      <h3>Try asking TaskMapr</h3>
      <ul>
        <li>“Show me the blocked tasks.”</li>
        <li>“What do the dashboard metrics look like?”</li>
        <li>“Who is responsible for onboarding?”</li>
      </ul>
      <p className="demo-muted">
        TaskMapr understands these prompts and will highlight the right areas for your users.
      </p>
    </section>
  );
};

export const DashboardPage = () => {
  const [metrics, setMetrics] = useState<DemoMetric[]>([]);
  const [tasks, setTasks] = useState<DemoTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([fetchDemoMetrics(), fetchDemoTasks()]).then(([metricData, taskData]) => {
      if (!mounted) return;
      setMetrics(metricData);
      setTasks(taskData);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="demo-page" aria-labelledby="dashboard-heading">
      <div className="demo-page__heading">
        <h1 id="dashboard-heading">Dashboard overview</h1>
        <p className="demo-muted">
          Inspect product health metrics and keep an eye on the workstream without leaving the page.
        </p>
      </div>

      <section id="dashboard-metrics" className="demo-section">
        <div className="demo-section__header">
          <h2>Key metrics</h2>
          <span className="demo-badge">{loading ? 'Refreshing…' : 'Live data'}</span>
        </div>
        <div className="demo-grid">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
          {!metrics.length && loading && (
            <div className="demo-card demo-empty">Loading metrics…</div>
          )}
        </div>
      </section>

      <div className="demo-grid demo-grid--balanced">
        <TaskSnapshot tasks={tasks} />
        <GuidancePanel />
      </div>
    </div>
  );
};

