import { Room } from '../types/Room';

export const rooms: Room[] = [
  {
    id: 'room_start',
    name: 'Starting Room',
    description:
      'A generic starting room. Plain walls surround you on all sides. ' +
      'Placeholder text — real flavour text goes here.',
    exits: {
      north: 'room_corridor',
    },
    items: ['item_key'],
  },
  {
    id: 'room_corridor',
    name: 'Corridor',
    description:
      'A long corridor stretching between rooms. The air is neutral and ' +
      'unremarkable. Placeholder text — real flavour text goes here.',
    exits: {
      south: 'room_start',
      east: 'room_end',
    },
    items: [],
  },
  {
    id: 'room_end',
    name: 'Final Room',
    description:
      'A room that marks the end of the placeholder area. ' +
      'More content will be added here when a theme is chosen.',
    exits: {
      west: 'room_corridor',
    },
    items: ['item_chest'],
  },
];
