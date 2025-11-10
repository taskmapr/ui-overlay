import { DemoTask } from '../mockBackend';
import { useHighlightable } from '../../hooks/useHighlightable';

interface TaskCardProps {
  task: DemoTask;
  isSelected?: boolean;
  onSelect?: (task: DemoTask) => void;
}

export const TaskCard = ({ task, isSelected = false, onSelect }: TaskCardProps) => {
  const highlightRef = useHighlightable<HTMLDivElement>({
    name: task.title,
    description: task.description,
    keywords: [task.status, task.assignee, task.priority],
    onClick: () => onSelect?.(task),
  });

  return (
    <article
      ref={highlightRef}
      id={`task-card-${task.id}`}
      className={`demo-card demo-task-card ${isSelected ? 'demo-task-card--selected' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(task)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect?.(task);
        }
      }}
      aria-pressed={isSelected}
    >
      <header className="demo-task-card__header">
        <span className={`demo-badge demo-badge--${task.priority.toLowerCase()}`}>{task.priority}</span>
        <span className={`demo-status demo-status--${task.status.toLowerCase().replace(/\s/g, '-')}`}>
          {task.status}
        </span>
      </header>
      <h3 className="demo-task-card__title">{task.title}</h3>
      <p className="demo-task-card__description">{task.description}</p>
      <footer className="demo-task-card__meta">
        <span>Assignee: <strong>{task.assignee}</strong></span>
        <span>Due: <strong>{new Date(task.dueDate).toLocaleDateString()}</strong></span>
      </footer>
    </article>
  );
};

