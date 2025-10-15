import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskItemComponent } from '../task-item/task-item.component';
import { Task } from '../models/task.model';

/*
  TaskList component
  ------------------
  Purpose:
  - Provides the task entry form and renders a list of tasks using the
    TaskItemComponent so the visual format matches the standalone item.

  Persistence:
  - Loads tasks from localStorage on initialization and persists changes on
    add/remove/complete. This preserves the user's tasks between page reloads.

  Notes:
  - nextId is computed from existing saved tasks to avoid id collisions when
    migrating or restoring saved data.
*/
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskItemComponent],
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.css']
})
export class TaskList {
  // Character limit constants
  readonly TITLE_MAX_LENGTH = 50;
  readonly DESCRIPTION_MAX_LENGTH = 250;

  // The in-memory array of tasks displayed in the template
  tasks: Task[] = [];

  // Form-bound properties for new task input
  newTitle = '';
  newDescription = '';
  newDueDate = ''; // bound to the form's date input (ISO yyyy-mm-dd)

  // Edit mode properties
  editingTaskId: number | null = null;
  editTitle = '';
  editDescription = '';
  editDueDate = ''; // bound while editing a task

  // Simple incrementing id for tasks created during this session
  private nextId = 1;

  /*
   * On init, try to read saved tasks from localStorage and initialize
   * the in-memory list. This preserves tasks between page reloads.
   */
  ngOnInit(): void {
    try {
      const raw = localStorage.getItem('tasks');
      if (raw) {
        const parsed: Task[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.tasks = parsed;
          // set nextId to one higher than the current max id to avoid collisions
          const maxId = this.tasks.reduce((m, t) => Math.max(m, t.id || 0), 0);
          this.nextId = maxId + 1;
        }
      }
    } catch (e) {
      // If parse fails, ignore and start fresh — avoid breaking the UI
      console.warn('Failed to read saved tasks from localStorage', e);
      this.tasks = [];
    }
  }

  /* Save current tasks array to localStorage. Kept in one helper for reuse. */
  private saveTasks(): void {
    try {
      localStorage.setItem('tasks', JSON.stringify(this.tasks));
    } catch (e) {
      console.warn('Failed to save tasks to localStorage', e);
    }
  }

  // addTask() is wired to the form's ngSubmit. It validates input, creates
  // a Task object, prepends it to the tasks list, and clears the form fields.
  addTask(): void {
    const title = this.newTitle?.trim();
    if (!title) return; // don't add empty tasks

    // Validate character limits
    if (title.length > this.TITLE_MAX_LENGTH) {
      console.warn(`Title exceeds maximum length of ${this.TITLE_MAX_LENGTH} characters`);
      return;
    }

    const description = this.newDescription?.trim() || '';
    if (description.length > this.DESCRIPTION_MAX_LENGTH) {
      console.warn(`Description exceeds maximum length of ${this.DESCRIPTION_MAX_LENGTH} characters`);
      return;
    }

    const task: Task = {
      id: this.nextId++,
      title,
      description,
      dueDate: this.newDueDate ? this.newDueDate : undefined,
      completed: false
    };

  // Prepend so newest items appear at the top
  this.tasks = [task, ...this.tasks];

  // Persist the updated list immediately
  this.saveTasks();

  // Reset inputs for the next entry
  this.newTitle = '';
  this.newDescription = '';
  }

  // Toggle the completed flag for a task; the checkbox in the template calls this.
  toggleComplete(task: Task): void {
    task.completed = !task.completed;
  // Save change to persistence
  this.saveTasks();
  }

  // Remove a task by id; used by the remove button in the template.
  remove(task: Task): void {
    this.tasks = this.tasks.filter(t => t.id !== task.id);
  // Persist removal
  this.saveTasks();
  }

  // Update the due date for an existing task and persist the change
  updateDueDate(task: Task, isoDate: string | null): void {
    task.dueDate = isoDate || undefined;
    this.saveTasks();
  }

  // Start editing a task by setting edit mode and populating edit fields
  startEdit(task: Task): void {
    this.editingTaskId = task.id;
    this.editTitle = task.title;
    this.editDescription = task.description || '';
  this.editDueDate = task.dueDate || '';
  }

  // Save the edited task and exit edit mode
  saveEdit(): void {
    const title = this.editTitle?.trim();
    if (!title || this.editingTaskId === null) return; // don't save empty titles

    // Validate character limits for editing
    if (title.length > this.TITLE_MAX_LENGTH) {
      console.warn(`Title exceeds maximum length of ${this.TITLE_MAX_LENGTH} characters`);
      return;
    }

    const description = this.editDescription?.trim() || '';
    if (description.length > this.DESCRIPTION_MAX_LENGTH) {
      console.warn(`Description exceeds maximum length of ${this.DESCRIPTION_MAX_LENGTH} characters`);
      return;
    }

    const task = this.tasks.find(t => t.id === this.editingTaskId);
    if (task) {
      task.title = title;
      task.description = description;
  // Save edited due date (empty string => remove due date)
  task.dueDate = this.editDueDate ? this.editDueDate : undefined;
      this.saveTasks();
    }

    // Exit edit mode
    this.cancelEdit();
  }

  // Cancel editing and exit edit mode
  cancelEdit(): void {
    this.editingTaskId = null;
    this.editTitle = '';
    this.editDescription = '';
  this.editDueDate = '';
  }

  // Helper method to check if a task is being edited
  isEditing(task: Task): boolean {
    return this.editingTaskId === task.id;
  }
}
