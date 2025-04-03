// src/app/features/tasks/my-tasks/my-tasks.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Task } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task.service';
import { DateUtilsService } from '../../../core/services/date-utils.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { format } from 'date-fns';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskDetailsComponent } from '../task-details/task-details.component';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    TaskFormComponent,
    TaskDetailsComponent
  ],
  templateUrl: './my-tasks.component.html'
})
export class MyTasksComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  loading = true;
  error: string | null = null;
  
  // Filters
  searchQuery = '';
  filterStatus = 'all';
  filterPriority = 'all';

  // Task form and details
  showTaskForm = false;
  taskToEdit: Task | null = null;
  selectedTask: Task | null = null;

  constructor(
    private taskService: TaskService,
    private dateUtilsService: DateUtilsService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.error = null;
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.error = 'User must be logged in to view tasks';
      this.loading = false;
      return;
    }
    
    this.taskService.getTasksAssignedToUser(currentUser.id).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error loading tasks: ' + (err.message || 'Unknown error');
        this.loading = false;
      }
    });
  }

  refreshTasks(): void {
    this.loadTasks();
  }

  /**
   * Formats the date to display as 'Today', 'Tomorrow', or a formatted date string
   */
  formatDate(date?: Date): string {
    if (!date) return 'No due date';
    
    // Check if the date is a string (which might happen in some cases)
    const taskDate = date instanceof Date ? date : new Date(date);
    
    if (this.dateUtilsService.isToday(taskDate)) {
      return 'Today';
    }
    
    if (this.dateUtilsService.isTomorrow(taskDate)) {
      return 'Tomorrow';
    }
    
    // If the date is within the next 7 days, show the day name
    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);
    
    if (taskDate <= oneWeekFromNow) {
      return format(taskDate, 'EEEE'); // Day name (Monday, Tuesday, etc.)
    }
    
    // Otherwise, show the full date
    return format(taskDate, 'MMM d, yyyy');
  }

  isPastDue(dueDate?: Date): boolean {
    if (!dueDate) return false;
    
    const now = new Date();
    const due = new Date(dueDate);
    
    // Set both dates to midnight for comparison
    now.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    return due < now;
  }

  updateTaskStatus(task: Task, newStatus: 'todo' | 'inProgress' | 'completed'): void {
    const updatedTask: Task = { ...task, status: newStatus };
    
    this.taskService.updateTask(updatedTask).subscribe({
      next: () => {
        // Update local task with new status
        task.status = newStatus;
        this.notificationService.success('Task status updated successfully');
      },
      error: (err) => {
        this.notificationService.error('Error updating task status: ' + (err.message || 'Unknown error'));
      }
    });
  }

  applyFilters(): void {
    // Start with all tasks
    let filtered = [...this.tasks];
    
    // Apply search query filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(query) || 
        task.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === this.filterStatus as 'todo' | 'inProgress' | 'completed');
    }
    
    // Apply priority filter
    if (this.filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === this.filterPriority as 'low' | 'medium' | 'high');
    }
    
    this.filteredTasks = filtered;
  }

  // Task form methods
  createTask(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.notificationService.error('You must be logged in to create a task');
      return;
    }

    this.taskToEdit = {
      id: '',
      title: '',
      status: 'todo',
      priority: 'medium',
      createdAt: new Date(),
      assignedTo: currentUser.id
    };
    this.showTaskForm = true;
  }

  editTask(task: Task): void {
    this.taskToEdit = { ...task };
    this.showTaskForm = true;
  }

  closeTaskForm(): void {
    this.showTaskForm = false;
    this.taskToEdit = null;
  }

  onTaskSaved(task: Task): void {
    this.closeTaskForm();
    this.loadTasks();
    this.notificationService.success(`Task ${task.id ? 'updated' : 'created'} successfully`);
  }

  // Task details methods
  viewTaskDetails(task: Task): void {
    this.selectedTask = task;
  }

  editTaskFromDetails(task: Task): void {
    this.closeTaskDetails();
    this.editTask(task);
  }

  closeTaskDetails(): void {
    this.selectedTask = null;
  }
}