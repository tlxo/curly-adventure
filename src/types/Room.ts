export type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';

export interface Room {
  id: string;
  name: string;
  description: string;
  exits: Partial<Record<Direction, string>>;
  items: string[];
}
