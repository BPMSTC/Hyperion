import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  // This is the URL for our backend API that talks to MongoDB
  private apiUrl = 'http://localhost:3000/tasks';

  // Injects Angular's HttpClient so we can make HTTP requests
  constructor(private http: HttpClient) {}

  // Gets all tasks from MongoDB by calling the backend API
  getTasks(): Observable<Task[]> {
    // Sends a GET request to /tasks, backend returns all tasks from MongoDB
    return this.http.get<Task[]>(this.apiUrl);
  }

  // Adds a new task to MongoDB by calling the backend API
  addTask(task: Task): Observable<Task> {
    // Sends a POST request to /tasks with the new task, backend saves it in MongoDB
    return this.http.post<Task>(this.apiUrl, task);
  }

  // Updates a task in MongoDB by calling the backend API
  updateTask(task: Task): Observable<Task> {
    // Sends a PUT request to /tasks/:id with updated task, backend updates it in MongoDB
    return this.http.put<Task>(`${this.apiUrl}/${task._id}`, task);
  }

  // Deletes a task from MongoDB by calling the backend API
  deleteTask(id: string): Observable<void> {
    // Sends a DELETE request to /tasks/:id, backend deletes it from MongoDB
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
