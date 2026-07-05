import styles from './TaskHeader.module.css';

interface TaskHeaderProps {
  selectedDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onDateChange: (date: Date) => void;
  onSignOut: () => void;
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function TaskHeader({ selectedDate, onPrevious, onNext, onDateChange, onSignOut }: TaskHeaderProps) {
  const selectedDay = formatDateInputValue(selectedDate);

  return (
    <>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Daily focus</p>
          <h1 className={styles.title}>DagensOpgaver</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateControls}>
            <button className={styles.iconButton} onClick={onPrevious} type="button">
              ←
            </button>
            <input
              type="date"
              className={styles.dateInput}
              value={selectedDay}
              onChange={(event) => onDateChange(parseDateInputValue(event.target.value))}
            />
            <button className={styles.iconButton} onClick={onNext} type="button">
              →
            </button>
          </div>
          <button className={styles.signOutButton} onClick={onSignOut} type="button">
            Sign out
          </button>
        </div>
      </header>

      <p className={styles.subtleText}>Showing tasks for {formatDisplayDate(selectedDate)}</p>
    </>
  );
}
