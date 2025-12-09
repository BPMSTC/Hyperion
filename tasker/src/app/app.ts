import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Task } from './models/task.model';
import { TaskList } from './task-list/task-list';
import { QuoteOfTheDayComponent } from './quote-of-the-day/quote-of-the-day.component';
import { WeatherWidgetComponent } from './weather-widget/weather-widget.component'
import { forkJoin, Observable } from 'rxjs';

// AppComponent: root component, delegates task creation and manages app-level state
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TaskList, QuoteOfTheDayComponent, WeatherWidgetComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  @ViewChild(TaskList) taskListComponent!: TaskList;  // Reference to TaskList component for task management
  tasks: Task[] = [];  // Array of tasks
  taskForm!: FormGroup;  // Reactive form for task input

  constructor(private fb: FormBuilder) { }

  // Theme preference: 'light' | 'dark' | 'auto'
  themePreference: 'light' | 'dark' | 'auto' = 'auto';
  private colorSchemeMql?: MediaQueryList;
  private colorSchemeListener?: (e: MediaQueryListEvent) => void;

  /**
   * Returns a human-friendly label for the current theme preference
   */
  get themeLabel(): string {
    if (!this.themePreference) return 'Automatic';
    return this.themePreference.charAt(0).toUpperCase() + this.themePreference.slice(1);
  }

  /**
   * Cycle the theme preference: auto -> light -> dark -> auto
   */
  cycleTheme() {
    const order: Array<'auto'|'light'|'dark'> = ['auto','light','dark'];
    const idx = order.indexOf(this.themePreference as any);
    const next = order[(idx + 1) % order.length];
    this.setThemePreference(next);
  }

  /**
   * ngOnInit: Initializes the task form with validation.
   */
  ngOnInit() {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1)]],
      description: ['']
    });

    // Load persisted theme preference
    try {
      const saved = localStorage.getItem('themePreference');
      if (saved === 'light' || saved === 'dark' || saved === 'auto') this.themePreference = saved;
      else this.themePreference = 'auto';
    } catch {
      this.themePreference = 'auto';
    }

    // Apply initial theme
    this.applyTheme(this.themePreference);

    // Listen for system preference changes when in 'auto'
    if (window && window.matchMedia) {
      this.colorSchemeMql = window.matchMedia('(prefers-color-scheme: dark)');
      this.colorSchemeListener = () => {
        if (this.themePreference === 'auto') this.applyTheme('auto');
      };
      if (this.colorSchemeMql.addEventListener) this.colorSchemeMql.addEventListener('change', this.colorSchemeListener);
      else (this.colorSchemeMql as any).addListener(this.colorSchemeListener);
    }
  }

  ngOnDestroy(): void {
    if (this.colorSchemeMql && this.colorSchemeListener) {
      if (this.colorSchemeMql.removeEventListener) this.colorSchemeMql.removeEventListener('change', this.colorSchemeListener);
      else (this.colorSchemeMql as any).removeListener(this.colorSchemeListener);
    }
  }

  setThemePreference(pref: string) {
    // Accept a broad string from the template and validate it here
    const validated: 'light' | 'dark' | 'auto' = (pref === 'light' || pref === 'dark' || pref === 'auto') ? pref : 'auto';
    this.themePreference = validated;
    try { localStorage.setItem('themePreference', validated); } catch {}
    this.applyTheme(validated);
  }

  private applyTheme(pref: 'light' | 'dark' | 'auto') {
    const useDark = pref === 'dark' ? true : pref === 'light' ? false : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    try {
      document.documentElement.setAttribute('data-theme', useDark ? 'dark' : 'light');
    } catch {}
  }

  /**
   * addTask: Adds a new task by submitting the task form and delegates creation to TaskList.
   */
  addTask() {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      if (this.taskListComponent) {
        this.taskListComponent.newTitle = formValue.title.trim();
        this.taskListComponent.newDescription = formValue.description?.trim() || '';
        this.taskListComponent.addTask();
      }
      this.taskForm.reset();
    }
  }
  
  /**
   * loadDemoTasks: Loads demo tasks for testing or initial setup, adds them to the backend, and refreshes the list.
   */
  loadDemoTasks(): void {
    const demoTasks: Task[] = [
      // Personal tasks
      {
        title: 'DEMO - Buy groceries',
        description: 'Milk, Bread, Eggs, Butter',
        category: 'Personal',
        completed: false,
        importance: 'Medium'
      },
      {
        title: 'DEMO - Gym workout',
        description: 'Upper body strength training and cardio',
        location: 'Fitness Center Downtown',
        dueDate: this.getFutureDate(2),
        category: 'Personal',
        completed: false,
        importance: 'Medium'
      },
      // Work tasks
      {
        title: 'DEMO - Finish project report',
        description: 'Complete the final draft of the project report and send it to the manager.',
        dueDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
        category: 'Work',
        completed: false,
        importance: 'High'
      },
      {
        title: 'DEMO - Team meeting prep',
        description: 'Prepare agenda and review project milestones',
        location: 'Conference Room B',
        dueDate: this.getFutureDate(3),
        category: 'Work',
        completed: false,
        importance: 'High'
      },
      // School tasks
      {
        title: 'DEMO - Complete Math homework',
        description: 'Finish chapters 5-7 exercises',
        location: 'Public Library, Stevens Point WI',
        dueDate: this.getFutureDate(5),
        category: 'School',
        completed: false,
        importance: 'High'
      },
      {
        title: 'DEMO - Study for Biology exam',
        description: 'Review cell biology and genetics chapters',
        dueDate: this.getFutureDate(7),
        category: 'School',
        completed: false,
        importance: 'Medium'
      },
      // Task without category
      {
        title: 'DEMO - Drop off package',
        location: 'FedEx Office, Plover WI',
        completed: false,
        importance: 'Low'
      }
    ];

    const addDemoTasksObservables = demoTasks.map(task => 
      this.taskListComponent.addTaskFromService(task)
    );

    forkJoin(addDemoTasksObservables).subscribe({
      next: (savedTasks) => {
        this.taskListComponent.ngOnInit();
      },
      error: (error) => {
        console.error('Error adding demo tasks:', error);
      }
    });
    
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

  /**
   * clearDemoTasks: Clears demo tasks from the task list and database, then refreshes the list.
   */
  clearDemoTasks(): void {
    const demoTasks = this.taskListComponent.tasks.filter(task => 
      task.title?.startsWith('DEMO -')
    );

    const deleteDemoTaskObservables = demoTasks.map(task => {
      if (task._id) {
        return this.taskListComponent.removeTask(task._id);
      }
      return new Observable(observer => observer.complete());
    });

    forkJoin(deleteDemoTaskObservables).subscribe({
      next: () => {
        this.taskListComponent.ngOnInit();
        
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
      },
      error: (error) => {
        console.error('Error clearing demo tasks:', error);
      }
    });
  }

  /**
   * getFutureDate: Helper to get a date N days in the future as an ISO string.
   */
  private getFutureDate(daysAhead: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().split('T')[0];
  }
}
