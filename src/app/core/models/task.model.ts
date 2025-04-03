// src/app/core/models/task.model.ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inProgress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
  attachments?: string[];
  assignedTo?: string; // User ID of assignee
  createdBy?: string;  // User ID of creator
}

// Used for creating a new task (without the server-generated fields)
export type TaskCreate = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

// File attachment type for task attachments
export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}