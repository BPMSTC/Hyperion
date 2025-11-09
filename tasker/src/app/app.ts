import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Task } from './models/task.model';
import { TaskList } from './task-list/task-list';
import { QuoteOfTheDayComponent } from './quote-of-the-day/quote-of-the-day.component';
import { WeatherWidgetComponent } from './weather-widget/weather-widget.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TaskList, QuoteOfTheDayComponent,WeatherWidgetComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  @ViewChild(TaskList) taskListComponent!: TaskList;  // Add this line
  tasks: Task[] = [];
  taskForm!: FormGroup;

  constructor(private fb: FormBuilder) { }


  ngOnInit() {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1)]],
      description: ['']
    });
  }

  addTask() {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      // Delegate to TaskList's addTask method, which uses TaskService and MongoDB
      if (this.taskListComponent) {
        this.taskListComponent.newTitle = formValue.title.trim();
        this.taskListComponent.newDescription = formValue.description?.trim() || '';
        this.taskListComponent.addTask();
      }
      this.taskForm.reset();
    }
  }
   generateTasksForDemo(): void {
    const sampleTasks: Task[] = [
      // Personal tasks
      {
        title: 'DEMO - Buy groceries',
        description: 'Milk, Bread, Eggs, Butter',
        category: 'Personal',
        completed: false
      },
      {
        title: 'DEMO - Gym workout',
        description: 'Upper body strength training and cardio',
        location: 'Fitness Center Downtown',
        dueDate: this.getFutureDate(2),
        category: 'Personal',
        completed: false
      },
      // Work tasks
      {
        title: 'DEMO - Finish project report',
        description: 'Complete the final draft of the project report and send it to the manager.',
        dueDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
        category: 'Work',
        completed: false
      },
      {
        title: 'DEMO - Team meeting prep',
        description: 'Prepare agenda and review project milestones',
        location: 'Conference Room B',
        dueDate: this.getFutureDate(3),
        category: 'Work',
        completed: false
      },
      // School tasks
      {
        title: 'DEMO - Complete Math homework',
        description: 'Finish chapters 5-7 exercises',
        location: 'Publicc Library, Stevens Point WI',
        dueDate: this.getFutureDate(5),
        category: 'School',
        completed: false
      },
      {
        title: 'DEMO - Study for Biology exam',
        description: 'Review cell biology and genetics chapters',
        dueDate: this.getFutureDate(7),
        category: 'School',
        completed: false
      },
      // Task without category
      {
        title: 'DEMO - Drop off package',
        location: 'FedEx Office, Plover WI',
        completed: false
      }
    ];

  // Add tasks through the public method
  sampleTasks.forEach(task => {
    this.taskListComponent.addTaskFromService(task);
  });

    // Refresh after all tasks are added
  setTimeout(() => {
    this.taskListComponent.ngOnInit();
  }, 1000);
    
    // Visual feedback
    const button = document.querySelector('.btn-demo:not(.btn-demo-clear)') as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = '✓ Demo Data Loaded!';
      button.classList.add('success');
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('success');
      }, 2000);
    }
  }

    clearTasksForDemo(): void {
    this.tasks = this.tasks.filter(task => !task.title?.startsWith('DEMO -'));
    this.taskListComponent.tasks = [...this.tasks];

    // Visual feedback
    const button = document.querySelector('.btn-demo-clear') as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = '✓ Demo Data Cleared!';
      button.classList.add('success');
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('success');
      }, 2000);
    }
  }

  // Helper to get a date N days in the future as an ISO string
  private getFutureDate(daysAhead: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().split('T')[0];
  }
}
