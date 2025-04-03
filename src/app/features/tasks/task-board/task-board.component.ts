// src/app/features/tasks/task-board/task-board.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Subject, Subscription, catchError, of, takeUntil } from 'rxjs';

import { TaskService } from '../../../core/services/task.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task } from '../../../core/models/task.model';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskDetailsComponent } from '../task-details/task-details.component';
import { TaskCalendarComponent } from '../task-calendar/task-calendar.component';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    TaskFormComponent,
    TaskDetailsComponent,
    TaskCalendarComponent
  ],
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.scss']
})
export class TaskBoardComponent implements OnInit, OnDestroy {
  // Task management
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  completedTasks: Task[] = [];
  
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
  isDragging = false;
  showTaskForm = false;
  showTaskDetails = false;
  currentTask: Task | null = null;
  selectedTask: Task | null = null;
  view: 'board' | 'calendar' = 'board';
  
  // Clean up subscriptions
  private destroy$ = new Subject<void>();
  private routeSubscription: Subscription | null = null;
  
  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Get the current user ID
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.id || null;
    
    // Get route parameters for view mode and filters
    this.routeSubscription = this.route.data.subscribe(data => {
      // Check if we're in calendar view
      if (data['view'] === 'calendar') {
        this.view = 'calendar';
      }
      
      // Get filter parameter
      if (data['filter']) {
        this.taskViewMode = data['filter'];
        this.loadTasksBasedOnViewMode();
      } else {
        this.loadAllTasks();
      }
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
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
      .subscribe(tasks => {
        this.tasks = tasks;
        this.applyFilters();
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
      .subscribe(tasks => {
        this.tasks = tasks;
        this.applyFilters();
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
      .subscribe(tasks => {
        this.tasks = tasks;
        this.applyFilters();
        this.isLoading = false;
      });
  }
  
  // View Mode Change
  changeTaskViewMode(mode: 'all' | 'my-tasks' | 'team-tasks'): void {
    if (this.taskViewMode === mode) return;
    
    this.taskViewMode = mode;
    this.loadTasksBasedOnViewMode();
    
    // Update the URL to reflect the current view mode
    this.router.navigate(['/tasks', mode === 'all' ? '' : mode]);
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
    this.updateTaskColumns();
  }
  
  updateTaskColumns(): void {
    this.todoTasks = this.filteredTasks.filter(task => task.status === 'todo');
    this.inProgressTasks = this.filteredTasks.filter(task => task.status === 'inProgress');
    this.completedTasks = this.filteredTasks.filter(task => task.status === 'completed');
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
      case 'todo': return 'inline-flex items-center px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800';
      case 'inProgress': return 'inline-flex items-center px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800';
      case 'completed': return 'inline-flex items-center px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800';
      default: return 'inline-flex items-center px-2 py-1 text-xs rounded-full bg-stone-100 text-stone-800';
    }
  }
  
  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'low': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  }
  
  getStatusDisplay(status: string): string {
    switch (status) {
      case 'todo': return 'To Do';
      case 'inProgress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  }
  
  isOverdue(dueDate?: Date): boolean {
    if (!dueDate) return false;
    const now = new Date();
    const due = new Date(dueDate);
    now.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < now;
  }
  
  // Task assignment helper function
  isAssignedToUser(task: Task): boolean {
    return !!this.currentUserId && task.assignedTo === this.currentUserId;
  }
  
  // Drag and drop handlers
  onDragStarted(): void {
    this.isDragging = true;
  }
  
  onDragEnded(): void {
    this.isDragging = false;
  }
  
  onDrop(event: CdkDragDrop<Task[]>): void {
    const previousStatus = this.getStatusFromListId(event.previousContainer.id);
    const newStatus = this.getStatusFromListId(event.container.id);
    
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      // Update the task status in the database
      const task = event.container.data[event.currentIndex];
      const updatedTask = { ...task, status: newStatus };
      
      this.taskService.updateTask(updatedTask)
        .pipe(
          catchError(error => {
            console.error('Error updating task status:', error);
            this.notificationService.error('Failed to update task status');
            
            // Revert the change
            transferArrayItem(
              event.container.data,
              event.previousContainer.data,
              event.currentIndex,
              event.previousIndex,
            );
            
            return of(null);
          })
        )
        .subscribe(result => {
          if (result) {
            this.notificationService.success(`Task moved to ${this.getStatusDisplay(newStatus)}`);
          }
        });
    }
  }
  
  private getStatusFromListId(id: string): 'todo' | 'inProgress' | 'completed' {
    switch (id) {
      case 'todo-list': return 'todo';
      case 'inProgress-list': return 'inProgress';
      case 'completed-list': return 'completed';
      default: return 'todo';
    }
  }
  
  // Task form handlers
  createTask(): void {
    this.currentTask = null;
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
}