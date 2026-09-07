export interface ExecutionHistoryItem {
  workflow_name: string;
  status: string;
  employee: string | null;
  completed_at: string | null;
}

export type ExecutionHistoryResponse = ExecutionHistoryItem[];