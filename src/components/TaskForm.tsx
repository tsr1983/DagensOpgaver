import styles from './TaskForm.module.css';

interface TaskFormProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export default function TaskForm({ draft, onDraftChange, onSubmit }: TaskFormProps) {
  return (
    <form className={styles.addForm} onSubmit={onSubmit}>
      <input
        className={styles.input}
        placeholder="Add a new task"
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
      />
      <button className={styles.primaryButton} type="submit">
        Add
      </button>
    </form>
  );
}
