export type RoomKind = 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'dining' | 'other';
export type Side = 'top' | 'right' | 'bottom' | 'left';
export type OpeningKind = 'door' | 'window';

export const SIDES: Side[] = ['top', 'right', 'bottom', 'left'];

export interface Opening {
  id: string;
  kind: OpeningKind;
  side: Side;
  offset: number; // feet from the left (top/bottom walls) or from the top (left/right walls)
  width: number; // feet
}

export interface Room {
  id: string;
  name: string;
  kind: RoomKind;
  x: number; // feet from the plot's left edge
  y: number; // feet from the plot's top edge (becomes the depth axis in 3D)
  width: number; // feet, along x
  depth: number; // feet, along y
  openings: Opening[];
}

export interface Plan {
  plot: { width: number; depth: number }; // feet
  wallHeight: number; // feet
  rooms: Room[];
}

export const ROOM_COLORS: Record<RoomKind, string> = {
  living: '#d3dde6', // mist
  bedroom: '#dcd6e8', // lavender grey
  kitchen: '#e6dcc4', // limewash
  bathroom: '#cfe3de', // celadon
  dining: '#e5d0c9', // clay blush
  other: '#d9dbd8', // concrete
};

export const ROOM_DEFAULTS: Record<RoomKind, { name: string; width: number; depth: number }> = {
  living: { name: 'Living room', width: 14, depth: 12 },
  bedroom: { name: 'Bedroom', width: 12, depth: 11 },
  kitchen: { name: 'Kitchen', width: 10, depth: 9 },
  bathroom: { name: 'Bathroom', width: 6, depth: 8 },
  dining: { name: 'Dining room', width: 10, depth: 9 },
  other: { name: 'Room', width: 8, depth: 8 },
};

export const OPENING_DEFAULTS: Record<OpeningKind, { name: string; width: number }> = {
  door: { name: 'Door', width: 3 },
  window: { name: 'Window', width: 4 },
};

export const SIDE_LABELS: Record<Side, string> = {
  top: 'Top',
  right: 'Right',
  bottom: 'Bottom',
  left: 'Left',
};