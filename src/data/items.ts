import { Item } from '../types/Item';

export const items: Item[] = [
  {
    id: 'item_key',
    name: 'key',
    description:
      'A small, unremarkable key. It looks like it might open something. ' +
      'Placeholder item — real description goes here.',
    takeable: true,
    aliases: ['old key', 'small key'],
  },
  {
    id: 'item_chest',
    name: 'chest',
    description:
      'A large wooden chest. It seems far too heavy to carry. ' +
      'Placeholder item — real description goes here.',
    takeable: false,
    aliases: ['wooden chest', 'large chest'],
  },
];
