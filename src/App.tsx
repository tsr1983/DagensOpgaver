import { useEffect, useMemo, useState } from 'react';
import MagicLogin from './components/magic-login/MagicLogin';

import { createTask, deleteTask, fetchTasks, reorderTasks, updateTask } from './api/tasks';
import type { TodoItem, ToDoItemDetails } from './types';
import styles from './app.module.css';
import TaskForm from './components/TaskForm/TaskForm';
import TaskHeader from './components/TaskHeader/TaskHeader';
import TaskList from './components/TaskList/TaskList';

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingDetails, setEditingDetails] = useState<string>('');
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

  const handleAddTask = async (title:string, details:ToDoItemDetails): Promise<boolean> => {
    
    if (!title.trim()) return false;

    try {
      const created = await createTask({ title: title.trim(), day: selectedDay, details: details ? JSON.stringify(details) : undefined });
      setTasks((current) => [...current, created]);
     
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add task');
      return false;
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
    const nextDetails = editingDetails.trim();
    if (!nextTitle) {
      setEditingId(null);
      setEditingText('');
      return;
    }

    try {
      const updated = await updateTask(task.id, { title: nextTitle, details: nextDetails ? JSON.stringify({ details: nextDetails }) : undefined });
      setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
      setEditingId(null);
      setEditingText('');
      setEditingDetails('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update task');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
    setEditingDetails('');
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
          tasks={tasks}
          selectedDate={selectedDate}
          onPrevious={() => setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() - 1))}
          onNext={() => setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1))}
          onDateChange={(date) => setSelectedDate(date)}
          onSignOut={handleSignOut}
        />

        <TaskForm onSubmit={handleAddTask} />

        {error && <p className={styles.error}>{error}</p>}

        <TaskList
          tasks={tasks}
          loading={loading}
          editingId={editingId}
          editingText={editingText}
          editingDetails={editingDetails}
          onEditingTextChange={setEditingText}
          onEditingDetailsChange={setEditingDetails}
          onToggleComplete={handleToggleComplete}
          onStartEdit={(task) => {
            setEditingId(task.id);
            setEditingText(task.title);
          }}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onDelete={handleDeleteTask}
          onDragEnd={handleReorder}
        />
      </div>
    </div>
  );
}
