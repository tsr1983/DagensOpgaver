export interface TodoItem {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  day: string; // ISO date string like YYYY-MM-DD
  completed: boolean;
  order: number;
  details:string;
}

export interface ApiTaskPayload {
  title: string;
  day: string;
  completed?: boolean;
}
