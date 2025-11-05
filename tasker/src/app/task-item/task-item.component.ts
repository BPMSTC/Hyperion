import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../models/task.model';


@Component({
  selector: 'app-task-item',
  standalone: true, //This component does not need to be declared in a module; it manages its own dependencies.
  //Since it's standalone, it must import its own dependencies like directives.
  imports: [CommonModule], 
  templateUrl: './task-item.html',
  styleUrls: ['./task-item.css']
})

export class TaskItemComponent {
  //This tells Angular that task is passed in from the parent component.
  @Input() task!: Task;  // note the ! tells TS this will always be set

  // Getter to determine if a task is overdue
  get isOverdue(): boolean {
    if (!this.task.dueDate || this.task.completed) {
      return false;
    }
    const today = new Date();
    const dueDate = new Date(this.task.dueDate);
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }

  // Function that returns the appropriate ID for overdue tasks (kept for compatibility)
  getTaskId(): string | null {
    return this.isOverdue ? 'overdueTask' : null;
  }
}