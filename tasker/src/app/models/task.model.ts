// src/app/models/task.model.ts
//this defines a TypeScript interface that represents the shape of a task object in your Angular app.
export interface Task { //This defines a TypeScript interface named Task, and makes it available for import in other files (like your task-item.ts).
  title: string;
  id: number;  
  description?: string;  // optional
  dueDate?: string; // optional ISO date string, e.g. '2025-10-06'
  location?: string; // optional location string
  completed: boolean;
}