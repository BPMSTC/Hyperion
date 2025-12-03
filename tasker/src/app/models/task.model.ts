// src/app/models/task.model.ts
//this defines a TypeScript interface that represents the shape of a task object in your Angular app.
export type TaskCategory = 'School' | 'Work' | 'Personal';

export interface Task {
  _id?: string; // MongoDB document ID (from MongoDB)
  title: string;
  description?: string;
  dueDate?: string;
  location?: string;
  category?: TaskCategory;
  completed: boolean;
  importance?:string;
}