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
    onUse: [
      {
        targetItemId: 'item_chest',
        successMessage: 'You use the key on the chest. It opens, revealing a coin inside.',
        effects: [
          { type: 'addItemToRoom', itemId: 'item_coin' },
          { type: 'removeItem', itemId: 'item_chest' },
        ],
        consumesSelf: true,
      },
    ],
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
  {
    id: 'item_coin',
    name: 'coin',
    description: 'A plain coin. Placeholder item — real description goes here.',
    takeable: true,
    aliases: ['small coin'],
  },
  {
    id: 'item_torch',
    name: 'torch',
    description: 'A torch. Placeholder item — real description goes here.',
    takeable: true,
    aliases: ['unlit torch', 'hand torch'],
    charges: 3,
    onUse: [
      {
        successMessage: 'You use the torch. Placeholder effect — real content goes here.',
        effects: [],
      },
    ],
  },
];
