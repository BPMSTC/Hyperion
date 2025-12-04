import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../models/task.model';


// TaskItemComponent: displays a single task, its status, and formatting
export class TaskItemComponent {
  //This tells Angular that task is passed in from the parent component.
  @Input() task!: Task;  // note the ! tells TS this will always be set

  /**
   * isOverdue: Returns true if the task is overdue and not completed.
   */
  get isOverdue(): boolean {
    if (!this.task.dueDate || this.task.completed) {
      return false;
    }
    const today = new Date();
    const dueDate = new Date(this.task.dueDate);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }

  /**
   * getTaskId: Returns a special ID for overdue tasks (used for styling).
   */
  getTaskId(): string | null {
    return this.isOverdue ? 'overdueTask' : null;
  }

  /**
   * formatDate: Formats an ISO date string as MM-DD-YYYY.
   */
  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  }
}
