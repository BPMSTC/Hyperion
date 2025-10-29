import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskItemComponent } from '../task-item/task-item.component';
import { Task } from '../models/task.model';
<<<<<<< HEAD
import { WeatherWidgetComponent } from '../weather-widget/weather-widget.component';
import { PlacesService, AutocompleteResult } from '../services/places.service';
=======
>>>>>>> origin/main

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
  newLocation = ''; // bound to the location input
  newDueDate = ''; // bound to the form's date input (ISO yyyy-mm-dd)
  locationSuggestions: AutocompleteResult[] = []; // autocomplete suggestions

  // Edit mode properties
  editingTaskId: number | null = null;
  editTitle = '';
  editDescription = '';
  editLocation = ''; // bound while editing a task location
  editDueDate = ''; // bound while editing a task
  editLocationSuggestions: AutocompleteResult[] = []; // autocomplete suggestions for edit mode

  // Simple incrementing id for tasks created during this session
  private nextId = 1;

  // Filter toggles
  filterCompleted = false; // when true, show only completed tasks
  filterOverdue = false; // when true, show only overdue tasks
  filterOldTasks = false; // when true, show only tasks older than 30 days
  // Controls whether the filter options panel is visible
  filterPanelOpen = false;

  // Debounce timer for location search
  private locationSearchTimeout: any;
  private editLocationSearchTimeout: any;

  constructor(private placesService: PlacesService) {}

  // Computed filtered list: tasks must match all active filters
  get filteredTasks(): Task[] {
    // Enforce completion visibility mode:
    // - filterCompleted === false (default): show only incomplete tasks
    // - filterCompleted === true: show only completed tasks
    // If filterOverdue is active, further restrict to overdue tasks (intersection).
    return this.tasks.filter(t => {
      if (t.completed !== this.filterCompleted) return false;
      if (this.filterOverdue && !this.isTaskOverdue(t)) return false;
      return true;
    });
  }

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
      location: this.newLocation ? this.newLocation.trim() : undefined,
      completed: false
    };

  // Prepend so newest items appear at the top
  this.tasks = [task, ...this.tasks];

  // Persist the updated list immediately
  this.saveTasks();

  // Reset inputs for the next entry
  this.newTitle = '';
  this.newDescription = '';
  this.newLocation = '';
  this.locationSuggestions = [];
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
    this.editLocation = task.location || '';
    this.editLocationSuggestions = []; // Clear any existing suggestions
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
      // Save edited location (empty string => remove location)
      task.location = this.editLocation ? this.editLocation.trim() : undefined;
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
    this.editLocation = '';
    this.editLocationSuggestions = [];
    // Clear any pending timeout for edit location search
    if (this.editLocationSearchTimeout) {
      clearTimeout(this.editLocationSearchTimeout);
    }
  }

  // Helper method to check if a task is being edited
  isEditing(task: Task): boolean {
    return this.editingTaskId === task.id;
  }

  // Method to check if a task is overdue
  isTaskOverdue(task: Task): boolean {
    if (!task.dueDate || task.completed) {
      return false;
    }
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }

  // Method to get ID for overdue task rows
  getOverdueRowId(task: Task): string | null {
    return this.isTaskOverdue(task) ? 'overdueTaskRow' : null;
  }

  generateTasksForDemo(): void {
    const sampleTasks: Task[] = [
      {
        id: this.nextId++,
        title: 'DEMO - Buy groceries',
        description: 'Milk, Bread, Eggs, Butter',
        completed: false
      },
      {
        id: this.nextId++,
        title: 'DEMO - Finish project report',
        description: 'Complete the final draft of the project report and send it to the manager.',
        // Sets the due date to 2 days ago. "T" takes the string and splits off the time portion.
        dueDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0], // 2 days ago
        completed: false
      },
      {
        id: this.nextId++,
        title: 'DEMO - drop off package',
        location: 'FedEx Office, Plover WI',
        completed: false
      }

    ];
    
    // Add sample tasks to the current tasks list
    this.tasks = [...sampleTasks, ...this.tasks];
    this.saveTasks();

    // Visual feedback - change button text and style
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
    // Define the titles of sample tasks to remove
    const sampleTaskTitles = ['DEMO - Buy groceries', 'DEMO - Finish project report'];
    
    // Filter out only the sample tasks, keeping all other tasks
    this.tasks = this.tasks.filter(task => !sampleTaskTitles.includes(task.title));
    this.saveTasks();

    // Visual feedback - change button text and style
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

  // Location-related methods
  onLocationInput(event: any): void {
    const query = event.target.value;
    
    // Clear previous timeout
    if (this.locationSearchTimeout) {
      clearTimeout(this.locationSearchTimeout);
    }

    // Clear suggestions if query is too short
    if (!query || query.length < 3) {
      this.locationSuggestions = [];
      return;
    }

    // Debounce the search to avoid too many API calls
    this.locationSearchTimeout = setTimeout(() => {
      this.placesService.getPlaceAutocomplete(query).subscribe({
        next: (suggestions: AutocompleteResult[]) => {
          this.locationSuggestions = suggestions;
        },
        error: (error: any) => {
          console.error('Error getting location suggestions:', error);
          this.locationSuggestions = [];
        }
      });
    }, 300); // 300ms delay
  }

  selectLocation(suggestion: AutocompleteResult): void {
    this.newLocation = this.placesService.formatLocationDisplay(suggestion);
    this.locationSuggestions = []; // Hide suggestions
  }

  formatLocationDisplay(suggestion: AutocompleteResult): string {
    return this.placesService.formatLocationDisplay(suggestion);
  }

  // Edit location methods
  onEditLocationInput(event: any): void {
    const query = event.target.value;
    
    // Clear previous timeout
    if (this.editLocationSearchTimeout) {
      clearTimeout(this.editLocationSearchTimeout);
    }

    // Clear suggestions if query is too short
    if (!query || query.length < 3) {
      this.editLocationSuggestions = [];
      return;
    }

    // Debounce the search to avoid too many API calls
    this.editLocationSearchTimeout = setTimeout(() => {
      this.placesService.getPlaceAutocomplete(query).subscribe({
        next: (suggestions: AutocompleteResult[]) => {
          this.editLocationSuggestions = suggestions;
        },
        error: (error: any) => {
          console.error('Error getting edit location suggestions:', error);
          this.editLocationSuggestions = [];
        }
      });
    }, 300); // 300ms delay
  }

  selectEditLocation(suggestion: AutocompleteResult): void {
    this.editLocation = this.placesService.formatLocationDisplay(suggestion);
    this.editLocationSuggestions = []; // Hide suggestions
  }

}
