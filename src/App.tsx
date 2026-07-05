import { useEffect, useMemo, useState } from 'react';
import MagicLogin from './components/magic-login/MagicLogin';
import TaskHeader from './components/TaskHeader';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { createTask, deleteTask, fetchTasks, reorderTasks, updateTask } from './api/tasks';
import type { TodoItem } from './types';
import styles from './app.module.css';

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const authApiBaseUrl = 'https://minimalapi.thomasrasmussen.dk';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [tasks, setTasks] = useState<TodoItem[]>([]);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const selectedDay = useMemo(() => formatDateKey(selectedDate), [selectedDate]);

  useEffect(() => {
    if (!isAuthenticated) {
      setTasks([]);
      return;
    }

    const loadTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await fetchTasks(selectedDay);
        setTasks(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load tasks');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [isAuthenticated, selectedDay]);

  const handleAuthChange = (user: { id: number; email: string; name: string | null } | null, isInitialCheck: boolean) => {
    setIsAuthenticated(Boolean(user));
    if (isInitialCheck) {
      setAuthChecked(true);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    try {
      const created = await createTask({ title: draft.trim(), day: selectedDay });
      setTasks((current) => [...current, created]);
      setDraft('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add task');
    }
  };

  const handleToggleComplete = async (task: TodoItem) => {
    try {
      const updated = await updateTask(task.id, { completed: !task.completed });
      setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update task');
    }
  };

  const handleSaveEdit = async (task: TodoItem) => {
    const nextTitle = editingText.trim();
    if (!nextTitle) {
      setEditingId(null);
      setEditingText('');
      return;
    }

    try {
      const updated = await updateTask(task.id, { title: nextTitle });
      setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
      setEditingId(null);
      setEditingText('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update task');
    }
  };

  const handleDeleteTask = async (task: TodoItem) => {
    try {
      await deleteTask(task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete task');
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch(`${authApiBaseUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      setError('Unable to sign out');
    } finally {
      setIsAuthenticated(false);
    }
  };

  const handleReorder = async (sourceIndex: number, destinationIndex: number) => {
    if (destinationIndex == null) return;

    const reordered = Array.from(tasks);
    const [moved] = reordered.splice(sourceIndex, 1);

    const insertIndex = sourceIndex < destinationIndex ? destinationIndex - 1 : destinationIndex;
    reordered.splice(insertIndex, 0, moved);

    setTasks(reordered);

    try {
      await reorderTasks(reordered.map((item) => item.id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reorder tasks');
    }
  };

  if (!authChecked) {
    return <MagicLogin apiBaseUrl={'https://minimalapi.thomasrasmussen.dk'} onAuthStateChange={handleAuthChange} />;
  }

  if (!isAuthenticated) {
    return <MagicLogin apiBaseUrl={'https://minimalapi.thomasrasmussen.dk'} onAuthStateChange={handleAuthChange} />;
  }

  return (
    <div className={styles.appShell}>
      <div className={styles.card}>
        <TaskHeader
          selectedDate={selectedDate}
          onPrevious={() => setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() - 1))}
          onNext={() => setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1))}
          onDateChange={(date) => setSelectedDate(date)}
          onSignOut={handleSignOut}
        />

        <TaskForm draft={draft} onDraftChange={setDraft} onSubmit={handleAddTask} />

        {error && <p className={styles.error}>{error}</p>}

        <TaskList
          tasks={tasks}
          loading={loading}
          editingId={editingId}
          editingText={editingText}
          onEditingTextChange={setEditingText}
          onToggleComplete={handleToggleComplete}
          onStartEdit={(task) => {
            setEditingId(task.id);
            setEditingText(task.title);
          }}
          onSaveEdit={handleSaveEdit}
          onDelete={handleDeleteTask}
          onDragEnd={handleReorder}
        />
      </div>
    </div>
  );
}
