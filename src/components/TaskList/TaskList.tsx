import React, { useRef, useState } from 'react';

import styles from './TaskList.module.css';
import { TodoItem } from '../../types';

interface TaskListProps {
  tasks: TodoItem[];
  loading: boolean;
  editingId: number | null;
  editingText: string;
  onEditingTextChange: (value: string) => void;
  onToggleComplete: (task: TodoItem) => void;
  onStartEdit: (task: TodoItem) => void;
  onSaveEdit: (task: TodoItem) => void;
  onDelete: (task: TodoItem) => void;
  onDragEnd: (sourceIndex: number, destinationIndex: number) => void;
}

export default function TaskList({
  tasks,
  loading,
  editingId,
  editingText,
  onEditingTextChange,
  onToggleComplete,
  onStartEdit,
  onSaveEdit,
  onDelete,
  onDragEnd,
}: TaskListProps) {
  if (loading) {
    return <p className={styles.emptyState}>Loading tasks…</p>;
  }

  if (tasks.length === 0) {
    return <p className={styles.emptyState}>Ingen opgaver i dag. Tilføj en ovenfor.</p>;
  }

  const dragIndexRef = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    setDraggingIndex(index);
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {}
    e.dataTransfer.effectAllowed = 'move';
  };

  

  const handleDropOnItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const srcStr = e.dataTransfer.getData('text/plain');
    const src = srcStr ? parseInt(srcStr, 10) : dragIndexRef.current;
    if (src == null || Number.isNaN(src)) return;

    // determine whether to insert before or after the hovered item based on pointer position
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    const dest = after ? index + 1 : index;

    dragIndexRef.current = null;
    setDraggingIndex(null);
    setDropIndex(null);
    onDragEnd(src, dest);
  };

  const handleDropOnList = (e: React.DragEvent) => {
    e.preventDefault();
    const srcStr = e.dataTransfer.getData('text/plain');
    const src = srcStr ? parseInt(srcStr, 10) : dragIndexRef.current;
    if (src == null || Number.isNaN(src)) return;
    // determine index based on pointer position relative to list children
    const list = e.currentTarget as HTMLElement;
    const children = Array.from(list.children).filter((n) => n instanceof HTMLElement) as HTMLElement[];
    let dest = tasks.length;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        dest = i;
        break;
      }
    }
    dragIndexRef.current = null;
    setDraggingIndex(null);
    setDropIndex(null);
    onDragEnd(src, dest);
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    // compute whether pointer is in lower half
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    const dest = after ? index + 1 : index;
    setDropIndex(dest);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleListDragOver = (e: React.DragEvent) => {
    // compute insertion index among children
    e.preventDefault();
    const list = e.currentTarget as HTMLElement;
    const children = Array.from(list.querySelectorAll(`.${styles.taskItem}`)) as HTMLElement[];
    let dest = tasks.length;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        dest = i;
        break;
      }
    }
    setDropIndex(dest);
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <ul className={styles.taskList} onDragOver={handleListDragOver} onDrop={handleDropOnList}>
            {tasks.map((task, index) => (
              <React.Fragment key={`frag-${task.id}`}>
                {dropIndex === index && (
                  <li key={`placeholder-${index}`} className={`${styles.taskItem} ${styles.placeholder}`} />
                )}
                <li
                  key={task.id}
                  className={`${styles.taskItem} ${task.completed ? styles.completed : ''} ${draggingIndex === index ? styles.dragging : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={() => { dragIndexRef.current = null; setDraggingIndex(null); setDropIndex(null); }}
                  onDragOver={(e) => handleItemDragOver(e, index)}
                  onDrop={(e) => handleDropOnItem(e, index)}
                >
                <div className={styles.taskMain}>
                      
                      <button
                        className={styles.checkButton}
                        onClick={() => onToggleComplete(task)}
                        type="button"
                        aria-label="Toggle complete"
                      >
                        {task.completed ? '✓' : ''}
                      </button>
                      {editingId === task.id ? (
                        <input
                          className={styles.editInput}
                          value={editingText}
                          onChange={(event) => onEditingTextChange(event.target.value)}
                          autoFocus
                          onBlur={() => onSaveEdit(task)}
                          onKeyDown={(event) => event.key === 'Enter' && onSaveEdit(task)}
                        />
                      ) : (
                        <span className={styles.taskText}>{task.title}</span>
                      )}
                    </div>
                    <div className={styles.taskActions}>
                      <button
                        className={styles.iconButton}
                        onClick={() => onStartEdit(task)}
                        type="button"
                        aria-label="Edit task"
                      >
                        ✎
                      </button>
                      <button
                        className={styles.iconButton}
                        onClick={() => onDelete(task)}
                        type="button"
                        aria-label="Delete task"
                      >
                        ×
                      </button>
                     
                    </div>
                  </li>
                  </React.Fragment>
                ))}
            {dropIndex === tasks.length && (
              <li key={`placeholder-end`} className={`${styles.taskItem} ${styles.placeholder}`} />
            )}
          </ul>
  );
}
