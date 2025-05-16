import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Track, TrackRow, ExtendedTrackRow, AudioType } from './track.types';

@Component({
  selector: 'app-track-table',
  templateUrl: './track-table.component.html',
  styleUrls: ['./track-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatSelectModule,
    DragDropModule,
    FormsModule
  ]
})
export class TrackTableComponent implements OnInit {
  displayedColumns: string[] = [
    'drag', 'type', 'component', 'filePosition', 'channels', 'split', 'audioType', 'remove'
  ];
  
  audioTypes: AudioType[] = ['mono-eng', 'stereo-eng', 'surround-eng', 'mono-fra', 'stereo-fra', 'surround-fra', 'mono-ger', 'stereo-ger', 'surround-ger', 'mono-spa', 'stereo-spa', 'surround-spa', 'mono-ita', 'stereo-ita', 'surround-ita'];
  trackRows: ExtendedTrackRow[] = [];
  originalTrackRows: ExtendedTrackRow[] = [];
  private rowStates = new Map<number, {
    transformation: Track;
    rightSideGreyedOut: boolean;
  }>();

  constructor(
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const initialTracks: Track[] = [
      { type: 'Video', component: 'Main Video', filePosition: 0, channels: 1, audioType: 'video' },
      { type: 'Audio', component: 'Mono_1', filePosition: 1, channels: 1, audioType: 'mono-eng' },
      { type: 'Audio', component: 'Mono_2', filePosition: 2, channels: 1, audioType: 'mono-eng' },
      { type: 'Audio', component: 'English Stereo', filePosition: 3, channels: 2, audioType: 'stereo-eng' },
      { type: 'Audio', component: 'English Surround', filePosition: 5, channels: 6, audioType: 'surround-eng' },
    ];

    this.initializeTrackRows(initialTracks);
  }

  private initializeTrackRows(tracks: Track[]) {
    this.trackRows = tracks.map(track => ({
      original: track,
      transformation: { ...track },
      leftSideGreyedOut: false,
      rightSideGreyedOut: false,
      splitCount: 0,
      isParentRow: true // All initial rows are parent rows
    }));
    this.originalTrackRows = this.trackRows;

    this.trackRows.forEach((row, index) => {
        this.rowStates.set(index, {
          transformation: { ...row.transformation },
          rightSideGreyedOut: row.rightSideGreyedOut
        });
    });

    this.cdr.detectChanges();
 }

  canShowSplitButton(row: ExtendedTrackRow): boolean {
    return !this.isVideoTrack(row) &&
           !row.leftSideGreyedOut &&
           !row.rightSideGreyedOut &&
           row.original.channels > 1 &&
           (row.isParentRow ?? true); // Only allow split if channels > 1
  }

  canShowRemoveButton(row: ExtendedTrackRow): boolean {
    return !this.isVideoTrack(row) && 
           row.leftSideGreyedOut && 
           !row.rightSideGreyedOut && 
           !row.isParentRow;
  }

  splitRow(index: number) {
    const sourceRow = this.trackRows[index];
    if (!this.canShowSplitButton(sourceRow)) return;

    // Only split if more than 1 channel
    if (sourceRow.original.channels <= 1) return;

    sourceRow.splitCount += 1;
    sourceRow.isParentRow = true;

    // Subtract 1 channel from source
    sourceRow.original.channels -= 1;
    sourceRow.transformation.channels = sourceRow.original.channels;

    // Determine new audioType for the split row
    let newAudioType: AudioType | undefined = undefined
    if (sourceRow.original.channels === 1) {
      // If source is mono after split, keep its audioType as mono
      if (sourceRow.original.audioType && sourceRow.original.audioType.startsWith('mono')) {
        newAudioType = sourceRow.original.audioType;
      } else if (sourceRow.original.audioType && sourceRow.original.audioType.includes('-')) {
        // If source was stereo/surround, use mono-<lang>
        const lang = sourceRow.original.audioType.split('-')[1];
        newAudioType = 'mono-' + lang as AudioType;
      }
    } else if (sourceRow.original.channels === 2) {
      // If source is stereo after split, keep its audioType as stereo
      if (sourceRow.original.audioType && sourceRow.original.audioType.startsWith('stereo')) {
        newAudioType = sourceRow.original.audioType;
      } else if (sourceRow.original.audioType && sourceRow.original.audioType.includes('-')) {
        const lang = sourceRow.original.audioType.split('-')[1];
        newAudioType = 'stereo-' + lang as AudioType;
      }
    } else if (sourceRow.original.channels === 6) {
      if (sourceRow.original.audioType && sourceRow.original.audioType.startsWith('surround')) {
        newAudioType = sourceRow.original.audioType;
      } else if (sourceRow.original.audioType && sourceRow.original.audioType.includes('-')) {
        const lang = sourceRow.original.audioType.split('-')[1];
        newAudioType = 'surround-' + lang as AudioType;
      }
    } else {
      // For 3, 4, 5 channels, set audioType to undefined
      // sourceRow.original.audioType = undefined
      sourceRow.transformation.audioType = undefined
      newAudioType = undefined
    }

    const newRow: ExtendedTrackRow = {
      original: {
        ...sourceRow.original,
        channels: 1,
        audioType: newAudioType
      },
      transformation: {
        ...sourceRow.original,
        channels: 1,
        audioType: newAudioType
      },
      leftSideGreyedOut: true,
      rightSideGreyedOut: false,
      splitCount: 0,
      isParentRow: false,
      parentRowIndex: index
    };

    // If the new row has 3, 4, or 5 channels (shouldn't happen, but for safety)
    if ([3,4,5].includes(newRow.original.channels)) {
      newRow.original.audioType = undefined;
      newRow.transformation.audioType = undefined;
    }

    this.trackRows.splice(index + 1, 0, newRow);
    this.trackRows = [...this.trackRows];
    this.recalculateFilePositions();
    this.cdr.detectChanges();
  }

  removeRow(index: number) {
    const rowToRemove = this.trackRows[index];
    if (!this.canShowRemoveButton(rowToRemove)) return;

    if (rowToRemove.parentRowIndex !== undefined) {
      const parentRow = this.trackRows[rowToRemove.parentRowIndex];
      if (parentRow) {
        parentRow.splitCount = Math.max(0, parentRow.splitCount - 1);
        parentRow.original.channels += 1;
        parentRow.transformation.channels = parentRow.original.channels;
      }
    }

    this.trackRows.splice(index, 1);
    this.trackRows = [...this.trackRows];
    this.recalculateFilePositions();
    this.cdr.detectChanges();
  }

  onChannelsChange(row: ExtendedTrackRow, index: number) {
    const newChannels = row.transformation.channels;
    const rowIndex = this.trackRows.indexOf(row);
    
    if (newChannels < 1 || newChannels > 6) {
      this.snackBar.open('Channel count must be between 1 and 6', 'Close', { duration: 3000 });
      return;
    }

    // Store current row's state if not already stored
    if (!this.rowStates.has(rowIndex)) {
      this.rowStates.set(rowIndex, {
        transformation: { ...row.transformation },
        rightSideGreyedOut: row.rightSideGreyedOut
      });
    }

    const affectedRows = this.findAffectedRows(rowIndex);
    
    // Store states of affected rows if not already stored
    affectedRows.forEach((affectedRow) => {
      const affectedRowIndex = this.trackRows.indexOf(affectedRow);
      if (!this.rowStates.has(affectedRowIndex)) {
        this.rowStates.set(affectedRowIndex, {
          transformation: { ...affectedRow.transformation },
          rightSideGreyedOut: affectedRow.rightSideGreyedOut
        });
      }
    });

    console.log('rowStates:', this.rowStates);

    const previousChannels = this.rowStates.get(rowIndex)?.transformation.channels || row.original.channels;

    console.log('if (newChannels > previousChannels) {', newChannels, previousChannels, newChannels > previousChannels);
    if (newChannels > previousChannels) {
      const nextRow = this.findNextEditableRow(rowIndex);
        console.log('nextRow:', nextRow);
      if (nextRow) {
        const nextRowIndex = this.trackRows.indexOf(nextRow);
        
        if (!this.rowStates.has(nextRowIndex)) {
          this.rowStates.set(nextRowIndex, {
            transformation: { ...nextRow.transformation },
            rightSideGreyedOut: nextRow.rightSideGreyedOut
          });
        }

        // If the next row has multiple channels and isn't fully split yet, split it first
        if (nextRow.original.channels > 1 && !this.hasEnoughSplits(nextRow)) {
          this.splitRow(nextRowIndex);
          const newNextRow = this.findNextEditableRow(rowIndex);
          if (newNextRow) {
            newNextRow.transformation = { ...row.transformation };
            newNextRow.rightSideGreyedOut = true;
            // newNextRow.leftSideGreyedOut = false;
            newNextRow.parentRowIndex = rowIndex; // Set parent reference
            newNextRow.isParentRow = false; // Mark as non-parent row
          }
        } else {
          nextRow.transformation = { ...row.transformation };
          nextRow.rightSideGreyedOut = true;
          nextRow.leftSideGreyedOut = false;
          nextRow.parentRowIndex = rowIndex; // Set parent reference
          nextRow.isParentRow = false; // Mark as non-parent row
        }

        // If we still need more splits based on the new channel count
        const additionalSplitsNeeded = newChannels - previousChannels;
        if (additionalSplitsNeeded > 0) {
          for (let i = 0; i < additionalSplitsNeeded - 1; i++) {
            const targetRow = this.findNextEditableRow(nextRowIndex + i);
            if (targetRow) {
              const targetIndex = this.trackRows.indexOf(targetRow);
              if (targetRow.original.channels > 1 && !this.hasEnoughSplits(targetRow)) {
                this.splitRow(targetIndex);
              }
              const newTargetRow = this.findNextEditableRow(rowIndex);
              if (newTargetRow) {
                newTargetRow.transformation = { ...row.transformation };
                newTargetRow.rightSideGreyedOut = true;
                newTargetRow.leftSideGreyedOut = false;
                newTargetRow.parentRowIndex = rowIndex; // Set parent reference
                newTargetRow.isParentRow = false; // Mark as non-parent row
              }
            }
          }
        }
      }
    } else if (newChannels <= previousChannels) {
      // Decreasing channels - restore last disabled row
      const lastDisabledRow = this.findLastDisabledRow(rowIndex);
      console.log('lastDisabledRow & rowIndex:', lastDisabledRow, rowIndex);
      if (lastDisabledRow) {
        const lastDisabledIndex = this.trackRows.indexOf(lastDisabledRow);
        const originalState = this.trackRows[lastDisabledIndex];
        console.log('originalState:', originalState);
        if (originalState) {
          lastDisabledRow.rightSideGreyedOut = false;
          lastDisabledRow.transformation = { ...originalState.original };
          lastDisabledRow.parentRowIndex = undefined; // Clear parent reference
          lastDisabledRow.isParentRow = !originalState.leftSideGreyedOut;
          this.rowStates.delete(lastDisabledIndex);
        }
      }
    }

    this.trackRows.forEach((row, index) => {
        this.rowStates.set(index, {
          transformation: { ...row.transformation },
          rightSideGreyedOut: row.rightSideGreyedOut
        });
    });

    this.cdr.detectChanges();
  }

  private findAffectedRows(startIndex: number): ExtendedTrackRow[] {
    const affected: ExtendedTrackRow[] = [];
    let currentIndex = startIndex + 1;
    
    while (currentIndex < this.trackRows.length) {
      const row = this.trackRows[currentIndex];
      if (row.rightSideGreyedOut) {
        affected.push(row);
      } else {
        break;
      }
      currentIndex++;
    }
    
    return affected;
  }

  private findLastDisabledRow(startIndex: number): ExtendedTrackRow | undefined {
    let lastDisabled: ExtendedTrackRow | undefined;
    let currentIndex = startIndex + 1;
    
    while (currentIndex < this.trackRows.length) {
      const row = this.trackRows[currentIndex];
      if (row.rightSideGreyedOut) {
        lastDisabled = row;
      } else {
        break;
      }
      currentIndex++;
    }
    
    return lastDisabled;
  }

  validateFilePosition(row: ExtendedTrackRow, newPosition: number): boolean {
    const oldPosition = row.transformation.filePosition;
    
    const conflictingRow = this.trackRows.find(r => 
      r !== row && 
      this.doPositionsOverlap(
        newPosition, 
        row.transformation.channels,
        r.transformation.filePosition,
        r.transformation.channels
      )
    );
    
    if (conflictingRow) {
      this.snackBar.open('File position conflicts with another track', 'Close', { duration: 3000 });
      row.transformation.filePosition = oldPosition;
      return false;
    }

    const rowIndex = this.trackRows.indexOf(row);
    const nextRow = this.findNextEditableRow(rowIndex);
    if (nextRow) {
      nextRow.transformation.filePosition = newPosition;
    }

    this.cdr.detectChanges();
    return true;
  }

  private doPositionsOverlap(pos1: number, channels1: number, pos2: number, channels2: number): boolean {
    const start1 = pos1;
    const end1 = pos1 + channels1 - 1;
    const start2 = pos2;
    const end2 = pos2 + channels2 - 1;
    return !(end1 < start2 || start1 > end2);
  }

  private getNextAvailablePosition(basePosition: number): number {
    let position = basePosition;
    while (this.trackRows.some(row => 
      row.transformation.filePosition === position || 
      (row.transformation.filePosition < position && 
       row.transformation.filePosition + row.transformation.channels > position)
    )) {
      position++;
    }
    return position;
  }

  validateAll(): boolean {
    const validationErrors: string[] = [];
    let isValid = true;
    const usedPositions = new Map<number, TrackRow>();

    for (const row of this.trackRows) {
      if (row.original.type === 'Video' && 
          (row.transformation.component !== row.original.component ||
           row.transformation.channels !== row.original.channels ||
           row.transformation.filePosition !== row.original.filePosition)) {
        this.snackBar.open('Video track cannot be modified', 'Close', { duration: 3000 });
        return false;
      }

      if (!row.leftSideGreyedOut && !row.rightSideGreyedOut) {
        for (let pos = row.transformation.filePosition; 
             pos < row.transformation.filePosition + row.transformation.channels; 
             pos++) {
          if (usedPositions.has(pos)) {
            this.snackBar.open('Track positions overlap', 'Close', { duration: 3000 });
            return false;
          }
          usedPositions.set(pos, row);
        }

        if (row.transformation.channels < 1 || row.transformation.channels > 6) {
          this.snackBar.open('Invalid channel count', 'Close', { duration: 3000 });
          return false;
        }
      }
    }

    return isValid;
  }

  update() {
    if (this.validateAll()) {
      this.originalTrackRows = this.trackRows;
      this.rowStates.clear(); // Clear stored states on successful update
      this.snackBar.open('Changes saved successfully', 'Close', { duration: 3000 });
    }
  } //make it so when you select an autiotype that is larger than it can fit, remove the rows that get in the way

  cancel() {
    this.trackRows = this.originalTrackRows;
    this.rowStates.clear(); // Clear stored states on cancel
    this.cdr.detectChanges();
  }

  isVideoTrack(row: ExtendedTrackRow): boolean {
    return row.original.type === 'Video';
  }

  onAudioTypeChange(row: ExtendedTrackRow) {
    if (!row.transformation.audioType) return;
    let channels = 1;
    if (row.transformation.audioType.includes('stereo')) channels = 2;
    else if (row.transformation.audioType.includes('surround')) channels = 6;
    const rowStart = this.trackRows.indexOf(row)
    for (let i = rowStart + 1; i < rowStart + channels; i++) {
      if (row.transformation.filePosition + channels > this.trackRows[i].transformation.filePosition) {
        if (this.trackRows[i].transformation.channels > 1) {
          this.splitRow(i);
          this.trackRows = [...this.trackRows];
          this.cdr.detectChanges();
          this.trackRows.splice(i+1, 1);
          i--;
        } else {
          this.trackRows.splice(i, 1);
        }
      }
    }
    this.trackRows = [...this.trackRows];
    row.transformation.channels = channels;
    row.original.channels = channels; // Ensure displayed value updates
    this.updateFilePositions()
  }

  drop(event: CdkDragDrop<ExtendedTrackRow[]>) {
    const prev = this.trackRows[event.previousIndex];
    const curr = this.trackRows[event.currentIndex];
    if (this.isVideoTrack(prev) || this.isVideoTrack(curr)) return;
    moveItemInArray(this.trackRows, event.previousIndex, event.currentIndex);
    this.trackRows = [...this.trackRows];
    this.recalculateFilePositions();
    this.cdr.detectChanges(); // Ensure view updates after drag-and-drop
  }

  private updateFilePositions() {
    let currentPosition = 1; // Start at 1 since video is at 0
    
    this.trackRows.forEach(row => {
      if (row.original.type === 'Video') return;
      if (!row.rightSideGreyedOut) {
        row.transformation.filePosition = currentPosition;
        currentPosition += row.transformation.channels;
      }
    });

    this.cdr.detectChanges();
  }

  private findNextEditableRow(currentIndex: number): ExtendedTrackRow | undefined {
    for (let i = currentIndex + 1; i < this.trackRows.length; i++) {
      if (!this.trackRows[i].rightSideGreyedOut && 
          !this.isVideoTrack(this.trackRows[i])) {
        return this.trackRows[i];
      }
    }
    return undefined;
  }

  private hasEnoughSplits(row: ExtendedTrackRow): boolean {
    return row.splitCount >= (row.original.channels - 1);
  }

  recalculateFilePositions() {
    let currentPosition = 1;
    for (let i = 0; i < this.trackRows.length; i++) {
      this.trackRows[i].original.filePosition = currentPosition;
      this.trackRows[i].transformation.filePosition = currentPosition;
      currentPosition += this.trackRows[i].original.channels;
    }
    this.cdr.detectChanges();
  }
}