export type TrackType = 'Video' | 'Audio';

export type AudioType = 
  | 'mono-eng' | 'stereo-eng' | 'surround-eng'
  | 'mono-fra' | 'stereo-fra' | 'surround-fra'
  | 'mono-ger' | 'stereo-ger' | 'surround-ger'
  | 'mono-spa' | 'stereo-spa' | 'surround-spa'
  | 'mono-ita' | 'stereo-ita' | 'surround-ita' | 'video';

export interface Track {
    type: TrackType;
    component: string;
    filePosition: number;
    channels: number;
    audioType?: AudioType;
}

export interface TrackRow {
    original: Track;
    transformation: Track;
    leftSideGreyedOut: boolean;
    rightSideGreyedOut: boolean;
}

export interface ExtendedTrackRow extends TrackRow {
    isParentRow?: boolean;  // Indicates if this is a parent row that can be split
    parentRowIndex?: number;  // Reference to the parent row if this is a split row
}