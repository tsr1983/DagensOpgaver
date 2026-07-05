import { Activity, useState } from "react";
import { ToDoItemDetails } from "../../types";
import styles from "./TaskForm.module.css";


interface TaskFormProps {
  onSubmit: (title: string, details: ToDoItemDetails) => Promise<boolean>;
}

export default function TaskForm({ onSubmit }: TaskFormProps) {
  const [details, setDetails] = useState("");
  const [title, setTitle] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    const result = await onSubmit(title.trim(), { details: details.trim() });
    if (result) {
      setTitle("");
      setDetails("");
    }
  };

  return (
    <form className={styles.addForm} onSubmit={handleSubmit}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input className={styles.input} placeholder="Tilføj opgave" value={title} onChange={(event) => setTitle(event.target.value)} />
        <button type="button" onClick={() => setShowDetails(!showDetails)} className={styles.iconButton}>
          {showDetails ? "−" : "+"}
        </button>
      </div>
      
      <Activity mode={showDetails ? "visible" : "hidden"}>
         <textarea className={styles.textarea} placeholder="Detaljer (valgfrit)" value={details} rows={3} onChange={(event) => setDetails(event.target.value)} />
      </Activity>
    
      <button className={styles.primaryButton} type="submit">
        Tilføj
      </button>
    </form>
  );
}
