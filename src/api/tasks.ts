import type { ApiTaskPayload, TodoItem } from '../types';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// const API_BASE_URL = 'https://localhost:7297';
const API_BASE_URL = 'https://minimalApi.thomasrasmussen.dk';


async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }

  const contentType = res.headers.get('content-type');
  const contentLength = res.headers.get('content-length');

  if (res.status === 204 || contentLength === '0') {
    return undefined as T;
  }

  if (!contentType?.includes('application/json')) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function fetchTasks(day: string): Promise<TodoItem[]> {
  return request<TodoItem[]>(`/tasks?day=${encodeURIComponent(day)}`);
}

export async function createTask(payload: ApiTaskPayload): Promise<TodoItem> {
  return request<TodoItem>('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTask(id: number, payload: Partial<ApiTaskPayload>): Promise<TodoItem> {
  return request<TodoItem>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteTask(id: number): Promise<void> {
  await request<void>(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderTasks(ids: number[]): Promise<TodoItem[]> {
  return request<TodoItem[]>('/tasks/reorder', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}
