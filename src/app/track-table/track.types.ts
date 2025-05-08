export type TrackType = 'Video' | 'Audio';

export interface Track {
    type: TrackType;
    component: string;
    filePosition: number;
    channels: number;
}

export interface TrackRow {
    original: Track;
    transformation: Track;
    leftSideGreyedOut: boolean;
    rightSideGreyedOut: boolean;
}

export interface ExtendedTrackRow extends TrackRow {
    splitCount: number;  // Making splitCount required with initial value of 0
    isParentRow?: boolean;  // Indicates if this is a parent row that can be split
    parentRowIndex?: number;  // Reference to the parent row if this is a split row
}