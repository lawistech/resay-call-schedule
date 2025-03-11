export interface CallStats {
  todayCalls: number;
  completedCalls: number;
  completionRate: number;
  callsByMethod: { method: string; count: number }[];
  callsByStatus: { status: string; count: number }[];
}