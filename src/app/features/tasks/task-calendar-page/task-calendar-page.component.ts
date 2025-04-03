// src/app/features/tasks/task-calendar-page/task-calendar-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription, catchError, of, takeUntil } from 'rxjs';
import { format, differenceInDays, isSameDay, isToday, isTomorrow } from 'date-fns';

import { TaskService } from '../../../core/services/task.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task } from '../../../core/models/task.model';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskDetailsComponent } from '../task-details/task-details.component';
import { TaskCalendarComponent } from '../task-calendar/task-calendar.component';

@Component({
  selector: 'app-task-calendar-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TaskFormComponent,
    TaskDetailsComponent,
    TaskCalendarComponent
  ],
  templateUrl: './task-calendar-page.component.html',
  styleUrls: ['./task-calendar-page.component.scss']
})
export class TaskCalendarPageComponent implements OnInit, OnDestroy {
  // Task state
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  selectedDate: Date = new Date();
  selectedDateTasks: Task[] = [];
  
  // Current user info
  currentUserId: string | null = null;

  // Task view mode
  taskViewMode: 'all' | 'my-tasks' | 'team-tasks' = 'all';
  
  // Filters
  searchTerm = '';
  statusFilter = 'all';
  priorityFilter = 'all';
  
  // View state
  isLoading = true;
  showTaskForm = false;
  showTaskDetails = false;
  currentTask: Task | null = null;
  selectedTask: Task | null = null;
  
  // Clean up subscriptions
  private destroy$ = new Subject<void>();
  
  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get the current user ID
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.id || null;
    
    this.loadTasksBasedOnViewMode();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Task Loading Methods
  loadTasksBasedOnViewMode(): void {
    switch (this.taskViewMode) {
      case 'my-tasks':
        this.loadMyTasks();
        break;
      case 'team-tasks':
        this.loadTeamTasks();
        break;
      default:
        this.loadAllTasks();
        break;
    }
  }
  
  loadAllTasks(): void {
    this.isLoading = true;
    this.taskService.getTasks()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading tasks:', error);
          this.notificationService.error('Failed to load tasks');
          return of([]);
        })
      )
      .subscribe((tasks: Task[]) => {
        this.tasks = tasks;
        this.applyFilters();
        this.updateSelectedDateTasks();
        this.isLoading = false;
      });
  }
  
  loadMyTasks(): void {
    this.isLoading = true;
    this.taskService.getMyTasks()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading my tasks:', error);
          this.notificationService.error('Failed to load your tasks');
          return of([]);
        })
      )
      .subscribe((tasks: Task[]) => {
        this.tasks = tasks;
        this.applyFilters();
        this.updateSelectedDateTasks();
        this.isLoading = false;
      });
  }
  
  loadTeamTasks(): void {
    this.isLoading = true;
    this.taskService.getTeamTasks()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading team tasks:', error);
          this.notificationService.error('Failed to load team tasks');
          return of([]);
        })
      )
      .subscribe((tasks: Task[]) => {
        this.tasks = tasks;
        this.applyFilters();
        this.updateSelectedDateTasks();
        this.isLoading = false;
      });
  }

  // View Mode Change
  changeTaskViewMode(mode: 'all' | 'my-tasks' | 'team-tasks'): void {
    if (this.taskViewMode === mode) return;
    
    this.taskViewMode = mode;
    this.loadTasksBasedOnViewMode();
  }
  
  // Filter Methods
  applyFilters(): void {
    let filtered = [...this.tasks];
    
    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(term) || 
        (task.description && task.description.toLowerCase().includes(term))
      );
    }
    
    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === this.statusFilter);
    }
    
    // Apply priority filter
    if (this.priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === this.priorityFilter);
    }
    
    this.filteredTasks = filtered;
    this.updateSelectedDateTasks();
  }
  
  updateSelectedDateTasks(): void {
    this.selectedDateTasks = this.filteredTasks.filter(task => {
      if (!task.dueDate) return false;
      
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, this.selectedDate);
    });
  }
  
  hasActiveFilters(): boolean {
    return this.searchTerm !== '' || this.statusFilter !== 'all' || this.priorityFilter !== 'all';
  }
  
  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }
  
  clearStatusFilter(): void {
    this.statusFilter = 'all';
    this.applyFilters();
  }
  
  clearPriorityFilter(): void {
    this.priorityFilter = 'all';
    this.applyFilters();
  }
  
  clearAllFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.priorityFilter = 'all';
    this.applyFilters();
  }
  
  // Utility methods for task display
  getStatusClass(status: string): string {
    switch (status) {
      case 'todo': return 'bg-amber-500';
      case 'inProgress': return 'bg-blue-500';
      case 'completed': return 'bg-emerald-500';
      default: return 'bg-stone-400';
    }
  }
  
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'todo': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'inProgress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  }
  
  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  }
  
  getStatusDisplay(status: string): string {
    switch (status) {
      case 'todo': return 'To Do';
      case 'inProgress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Unknown Status';
    }
  }
  
  isOverdue(dueDate?: Date): boolean {
    if (!dueDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    
    return taskDate < today;
  }
  
  // Task assignment helper function
  isAssignedToUser(task: Task): boolean {
    return !!this.currentUserId && task.assignedTo === this.currentUserId;
  }

  // Date selection handler
  onDateSelected(date: Date): void {
    this.selectedDate = date;
    this.updateSelectedDateTasks();
  }
  
  // Task form handlers
  createTask(): void {
    this.currentTask = null;
    this.showTaskForm = true;
  }
  
  createTaskForSelectedDate(): void {
    this.currentTask = {
      id: '',
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: this.selectedDate,
      createdAt: new Date(),
      assignedTo: this.currentUserId || undefined
    };
    this.showTaskForm = true;
  }
  
  editTask(task: Task): void {
    this.currentTask = task;
    this.showTaskForm = true;
  }
  
  closeTaskForm(): void {
    this.showTaskForm = false;
    this.currentTask = null;
  }
  
  onTaskSaved(task: Task): void {
    this.showTaskForm = false;
    this.currentTask = null;
    this.loadTasksBasedOnViewMode();
  }
  
  // Task details handlers
  viewTaskDetails(task: Task): void {
    this.selectedTask = task;
    this.showTaskDetails = true;
  }
  
  editTaskFromDetails(task: Task): void {
    this.closeTaskDetails();
    this.editTask(task);
  }
  
  closeTaskDetails(): void {
    this.showTaskDetails = false;
    this.selectedTask = null;
  }
  
  // Delete task
  deleteTask(taskId: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId)
        .pipe(
          catchError(error => {
            console.error('Error deleting task:', error);
            this.notificationService.error('Failed to delete task');
            return of(null);
          })
        )
        .subscribe(() => {
          this.notificationService.success('Task deleted successfully');
          this.loadTasksBasedOnViewMode();
        });
    }
  }
  
  // Format date for display
  formatDate(date?: Date): string {
    if (!date) return 'No due date';
    
    const taskDate = date instanceof Date ? date : new Date(date);
    
    if (isToday(taskDate)) {
      return 'Today';
    }
    
    if (isTomorrow(taskDate)) {
      return 'Tomorrow';
    }
    
    const diff = differenceInDays(taskDate, new Date());
    
    if (diff >= -1 && diff <= 7) {
      return format(taskDate, 'EEEE'); // Day name (Monday, Tuesday, etc.)
    }
    
    return format(taskDate, 'MMM d, yyyy');
  }
}