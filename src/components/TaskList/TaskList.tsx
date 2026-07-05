import React, { useRef, useState } from "react";

import styles from "./TaskList.module.css";
import { TodoItem, ToDoItemDetails } from "../../types";

interface TaskListProps {
  tasks: TodoItem[];
  loading: boolean;
  editingId: number | null;
  editingText: string;
  editingDetails: string;
  onEditingTextChange: (value: string) => void;
  onEditingDetailsChange: (value: string) => void;
  onToggleComplete: (task: TodoItem) => void;
  onStartEdit: (task: TodoItem) => void;
  onSaveEdit: (task: TodoItem) => void;
  onCancelEdit: () => void;
  onDelete: (task: TodoItem) => void;
  onDragEnd: (sourceIndex: number, destinationIndex: number) => void;
}

export default function TaskList({ tasks, loading, editingId, editingText, editingDetails, onEditingTextChange, onEditingDetailsChange, onToggleComplete, onStartEdit, onSaveEdit, onCancelEdit, onDelete, onDragEnd }: TaskListProps) {
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
      e.dataTransfer.setData("text/plain", String(index));
    } catch {}
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const srcStr = e.dataTransfer.getData("text/plain");
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
    const srcStr = e.dataTransfer.getData("text/plain");
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
    e.dataTransfer.dropEffect = "move";
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
    e.dataTransfer.dropEffect = "move";
  };

  const showDetails = (task: TodoItem) => {
    if (task.details) {
      let parsed = JSON.parse(task.details) as ToDoItemDetails;
      return <p className={styles.taskDetails}>{parsed.details}</p>;
    }
    return null;
  };

  const showTimestamp = (task: TodoItem) => {
    if (task.updatedAt) {
      return new Date(task.updatedAt).toLocaleString("da-DK", {    
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <ul className={styles.taskList} onDragOver={handleListDragOver} onDrop={handleDropOnList}>
      {tasks.map((task, index) => (
        <React.Fragment key={task.id}>
          {dropIndex === index && (
            <div className={`${styles.taskWrapper} ${styles.placeholderWrapper}`} key={`placeholder-wrapper-${index}`}>
              <li key={`placeholder-${index}`} className={`${styles.taskItem} ${styles.placeholder}`} />
              <div className={styles.taskDetailsPlaceholder} />
            </div>
          )}
          <div className={styles.taskWrapper}>
            <li
              key={task.id}
              className={`${styles.taskItem} ${task.completed ? styles.completed : ""} ${draggingIndex === index ? styles.dragging : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={() => {
                dragIndexRef.current = null;
                setDraggingIndex(null);
                setDropIndex(null);
              }}
              onDragOver={(e) => handleItemDragOver(e, index)}
              onDrop={(e) => handleDropOnItem(e, index)}
            >
              <div className={styles.taskTimestamp}>
                opdateret {showTimestamp(task)}
              </div>
              <div className={styles.taskMain}>
                <button className={styles.checkButton} onClick={() => onToggleComplete(task)} type="button" aria-label="Toggle complete">
                  {task.completed ? "✓" : ""}
                </button>
                {editingId === task.id ? (
                  <div className={styles.editContainer}>
                    <input className={styles.editInput} value={editingText} onChange={(event) => onEditingTextChange(event.target.value)} autoFocus onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onSaveEdit(task);
                      }
                    }} />
                    <textarea className={styles.editDetails} value={editingDetails} onChange={(event) => onEditingDetailsChange(event.target.value)} placeholder="Add details..." onKeyDown={(event) => {
                      if (event.key === "Enter" && event.ctrlKey) {
                        onSaveEdit(task);
                      }
                    }} />
                  </div>
                ) : (
                  <>
                    <span className={styles.taskText}>{task.title}</span>
                  </>
                )}
              </div>

              <div className={styles.taskActions}>
                {editingId === task.id ? (
                  <>
                    <button className={styles.iconButton} onClick={() => onSaveEdit(task)} type="button" aria-label="Save task" title="Save">
                      ✓
                    </button>
                    <button className={styles.iconButton} onClick={() => onCancelEdit()} type="button" aria-label="Cancel edit" title="Cancel">
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <button className={styles.iconButton} onClick={() => {
                      const details = task.details ? JSON.parse(task.details).details : "";
                      onEditingDetailsChange(details);
                      onStartEdit(task);
                    }} type="button" aria-label="Edit task" title="Edit">
                      ✎
                    </button>
                    <button className={styles.iconButton} onClick={() => onDelete(task)} type="button" aria-label="Delete task" title="Delete">
                      ×
                    </button>
                  </>
                )}
              </div>
             
            </li>
            <div>
              {showDetails(task)}
            </div>
          </div>
        </React.Fragment>
      ))}
      {dropIndex === tasks.length && (
        <div className={`${styles.taskWrapper} ${styles.placeholderWrapper}`} key={`placeholder-end-wrapper`}>
          <li key={`placeholder-end`} className={`${styles.taskItem} ${styles.placeholder}`} />
          <div className={styles.taskDetailsPlaceholder} />
        </div>
      )}
    </ul>
  );
}
