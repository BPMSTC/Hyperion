// src/app/models/task.model.ts
//this defines a TypeScript interface that represents the shape of a task object in your Angular app.
export type TaskCategory = 'School' | 'Work' | 'Personal';

// Task interface: represents a single task item stored in MongoDB
export interface Task {
  // MongoDB document ID
  _id?: string;
  // Task title
  title: string;
  // Task description (optional)
  description?: string;
  // Due date in ISO format (optional)
  dueDate?: string;
  // Location for the task (optional)
  location?: string;
  // Task category (optional)
  category?: TaskCategory;
  // Completion status
  completed: boolean;
  // Importance rating (optional)
  importance?: string;
}