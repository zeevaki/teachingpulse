export type Category = {
  id: string;
  label: string;
  emoji: string;
  /** Index into the fixed categorical palette (see globals.css --series-N vars) */
  slot: number;
};

export type LogEntry = {
  id: string;
  categoryId: string;
  startTime: number; // epoch ms
  endTime: number | null; // null while the activity is running
  /** True if this entry was auto-stopped for exceeding the max duration, not manually stopped. */
  autoStopped?: boolean;
};
