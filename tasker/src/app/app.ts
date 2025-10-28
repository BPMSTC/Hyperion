import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Task } from './models/task.model';
// TaskItemComponent is used by the TaskList; TaskList is imported below so the
// standalone component can be referenced in this App component's `imports`.
// These imports were added so the new `app-task-list` UI can be rendered
// from the app root instead of the previous inline form/list.
import { TaskList } from './task-list/task-list';
import { QuoteOfTheDayComponent } from './quote-of-the-day/quote-of-the-day.component';

@Component({
  selector: 'app-root',
  standalone: true,
  // Note: TaskList was added to the imports so the App component can render
  // the standalone <app-task-list> component directly in its template.
  imports: [CommonModule, ReactiveFormsModule, TaskList, QuoteOfTheDayComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  tasks: Task[] = [];
  taskForm!: FormGroup;

  constructor(private fb: FormBuilder) {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      this.tasks = JSON.parse(savedTasks);
    }
  }

  ngOnInit() {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1)]],
      description: ['']
    });
  }

  addTask() {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      const newTask: Task = {
        id: Date.now(),
        title: formValue.title.trim(),
        description: formValue.description?.trim() || '',
        completed: false
      };

      // Add the new task to the tasks array
      this.tasks.push(newTask);

      // Save to localStorage
      localStorage.setItem('tasks', JSON.stringify(this.tasks));

      // Reset the form
      this.taskForm.reset();
    }
  }
}
