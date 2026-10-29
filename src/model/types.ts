export type RoomKind = 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'dining' | 'other';

export interface Room {
  id: string;
  name: string;
  kind: RoomKind;
  x: number; // feet from the plot's left edge
  y: number; // feet from the plot's top edge (becomes the depth axis in 3D)
  width: number; // feet, along x
  depth: number; // feet, along y
}

export interface Plan {
  plot: { width: number; depth: number }; // feet
  wallHeight: number; // feet
  rooms: Room[];
}

export const ROOM_COLORS: Record<RoomKind, string> = {
  living: '#cfe3f1',
  bedroom: '#e6d3f0',
  kitchen: '#f5dfb5',
  bathroom: '#c8ebe3',
  dining: '#f2cfc9',
  other: '#dddddd',
};