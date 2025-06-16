// Track interface for use in the tables
export interface Track {
  id: number; // unique identifier
  trackType: string;
  position: number; // position is an index in the array, not a string
  channels: number;
}

// Optionally, you can define types for split/merge operations if needed later.