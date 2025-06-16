import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Track } from './track.types';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-track-table',
  templateUrl: './track-table.component.html',
  styleUrls: ['./track-table.component.scss'],
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  standalone: true
})
export class TrackTableComponent {
  // Mock data for demonstration
  allTracks: Track[] = [
    { id: 1, trackType: 'Audio', position: 1, channels: 2 },
    { id: 2, trackType: 'Audio', position: 2, channels: 2 },
    { id: 3, trackType: 'MIDI', position: 3, channels: 1 },
  ];

  // Track IDs selected in the left table
  selectedTrackIds: Set<number> = new Set();

  // Tracks in the right table (modifications/additions)
  rightTableTracks: Track[] = [];

  // For hover state (to show - icon)
  hoveredRightTrackId: number | null = null;

  updatedRightTracks: Track[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  // Checkbox handler for left table
  onLeftTableCheck(track: Track, checked: boolean) {
    if (checked) {
      this.selectedTrackIds.add(track.id);
      // If not already in right table, add for modification
      if (!this.rightTableTracks.find(t => t.id === track.id)) {
        this.rightTableTracks = [...this.rightTableTracks, { ...track }];
      }
    } else {
      this.selectedTrackIds.delete(track.id);
      // Remove from right table if present
      this.rightTableTracks = this.rightTableTracks.filter(t => t.id !== track.id);
    }
  }

  // Add new track (with temporary negative id)
  addNewTrack() {
    const newId = this.getNextNegativeId();
    this.rightTableTracks = [
      ...this.rightTableTracks,
      {
        id: newId,
        trackType: '',
        position: this.rightTableTracks.length + 1, // Position based on current length 
        channels: 1
      }
    ];
  }

  // Remove track from right table
  removeRightTrack(trackId: number) {
    this.rightTableTracks = this.rightTableTracks.filter(t => t.id !== trackId);
    // If it was a modification of an existing track, also uncheck in left table
    if (trackId > 0) {
      this.selectedTrackIds.delete(trackId);
    }
  }

  // Utility to get next negative id for new tracks
  private getNextNegativeId(): number {
    const minId = Math.min(0, ...this.rightTableTracks.map(t => t.id));
    return minId - 1;
  }

  // Placeholder for split/merge logic
  splitTrack(track: Track) {
    // Implement split logic here
  }

  mergeTracks(trackIds: number[]) {
    // Implement merge logic here
  }

  // Handler for editing a track in the right table
  updateRightTrack(trackId: number, changes: Partial<Track>) {
    const idx = this.rightTableTracks.findIndex(t => t.id === trackId);
    if (idx !== -1) {
      const updated = { ...this.rightTableTracks[idx], ...changes };
      this.updatedRightTracks = [
        ...this.rightTableTracks.slice(0, idx),
        updated,
        ...this.rightTableTracks.slice(idx + 1)
      ];
    }
  }

  onSubmit() {
    // Tracks that are unchecked in the left table
    const uncheckedTracks = this.allTracks.filter(track => !this.selectedTrackIds.has(track.id));
    // The new left table tracks are the submitted right table tracks plus the unchecked tracks
    this.allTracks = [...uncheckedTracks, ...this.rightTableTracks];
    // Clear right table and selection
    this.rightTableTracks = [];
    this.selectedTrackIds.clear();
  }
}
