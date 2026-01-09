export interface QueueEventMessage {
  taskId: string;
  type: 'PROCESSING' | 'PROGRESS' | 'COMPLETED' | 'FAILURE';
  payload: {
    percentage?: number;
    message?: string;
    result?: any;
    error?: string;
  };
  timestamp: string;
}