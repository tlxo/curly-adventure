import { Direction } from './Room';

export type UseEffect =
  | { type: 'addItemToRoom'; itemId: string }
  | { type: 'removeItem'; itemId: string }
  | { type: 'addExit'; direction: Direction; roomId: string }
  | { type: 'removeExit'; direction: Direction }
  | { type: 'updateRoomDescription'; description: string };

export interface UseAction {
  /** If set, the player must target this item ID (e.g. "use key on chest"). */
  targetItemId?: string;
  /** Item that must be in inventory for this action to work. */
  requiredItemId?: string;
  /** Message shown on success. */
  successMessage: string;
  /** State mutations applied on success. */
  effects: UseEffect[];
  /** Destroy the item being used after a successful use. */
  consumesSelf?: boolean;
  /** Destroy the required item after a successful use. */
  consumesRequired?: boolean;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  takeable: boolean;
  aliases: string[];
  /**
   * Remaining uses for this item. `undefined` means unlimited.
   * When it reaches 0 the item cannot be used.
   */
  charges?: number;
  /** One or more ways this item can be used. */
  onUse?: UseAction[];
}
