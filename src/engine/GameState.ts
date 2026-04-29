import { Room } from '../types/Room';
import { Item, UseEffect, UseAction } from '../types/Item';
import { ParsedCommand } from './Parser';

export interface GameState {
  currentRoomId: string;
  inventory: string[];
  rooms: Map<string, Room>;
  items: Map<string, Item>;
  messages: string[];
}

export function createGameState(
  roomList: Room[],
  itemList: Item[],
  startRoomId: string,
): GameState {
  return {
    currentRoomId: startRoomId,
    inventory: [],
    rooms: new Map(roomList.map((r) => [r.id, r])),
    items: new Map(itemList.map((i) => [i.id, i])),
    messages: [],
  };
}

export function processCommand(state: GameState, command: ParsedCommand): GameState {
  const next: GameState = { ...state, messages: [] };

  switch (command.type) {
    case 'look':
      return handleLook(next, command.args);
    case 'go':
      return handleGo(next, command.args);
    case 'take':
      return handleTake(next, command.args);
    case 'drop':
      return handleDrop(next, command.args);
    case 'inventory':
      return handleInventory(next);
    case 'examine':
      return handleExamine(next, command.args);
    case 'use':
      return handleUse(next, command.args);
    case 'help':
      return handleHelp(next);
    case 'quit':
      return { ...next, messages: ['Goodbye!'] };
    default:
      return {
        ...next,
        messages: ["I don't understand that command. Type 'help' for a list of commands."],
      };
  }
}

function handleLook(state: GameState, args: string[]): GameState {
  const room = state.rooms.get(state.currentRoomId);
  if (!room) return { ...state, messages: ['Error: current room not found.'] };

  if (args.length === 0) {
    const exitList = Object.keys(room.exits).join(', ');
    const itemList = room.items
      .map((id) => state.items.get(id)?.name ?? id)
      .join(', ');
    const msg = [
      `**${room.name}**`,
      room.description,
      exitList ? `Exits: ${exitList}` : 'There are no exits.',
      itemList ? `You see: ${itemList}` : 'There are no items here.',
    ].join('\n');
    return { ...state, messages: [msg] };
  }

  // "look at <item>" — strip preposition "at" before delegating
  const target = args.filter((a) => a !== 'at').join(' ');
  return handleExamine(state, target ? [target] : []);
}

function handleGo(state: GameState, args: string[]): GameState {
  if (args.length === 0) return { ...state, messages: ['Go where?'] };

  const direction = args[0] as keyof Room['exits'];
  const room = state.rooms.get(state.currentRoomId);
  if (!room) return { ...state, messages: ['Error: current room not found.'] };

  const nextRoomId = room.exits[direction];
  if (!nextRoomId) return { ...state, messages: [`You can't go ${direction} from here.`] };

  const nextRoom = state.rooms.get(nextRoomId);
  if (!nextRoom) return { ...state, messages: ['Error: destination room not found.'] };

  return handleLook({ ...state, currentRoomId: nextRoomId }, []);
}

function handleTake(state: GameState, args: string[]): GameState {
  if (args.length === 0) return { ...state, messages: ['Take what?'] };

  // Support "pick up <item>": strip the preposition "up" from args
  const target = args.filter((a) => a !== 'up').join(' ');
  if (!target) return { ...state, messages: ['Take what?'] };

  const room = state.rooms.get(state.currentRoomId);
  if (!room) return { ...state, messages: ['Error: current room not found.'] };

  const itemId = findItemInList(state, room.items, target);
  if (!itemId) return { ...state, messages: [`There's no ${target} here.`] };

  const item = state.items.get(itemId)!;
  if (!item.takeable) return { ...state, messages: [`You can't take the ${item.name}.`] };

  const updatedRoom: Room = { ...room, items: room.items.filter((id) => id !== itemId) };
  const updatedRooms = new Map(state.rooms);
  updatedRooms.set(room.id, updatedRoom);

  return {
    ...state,
    rooms: updatedRooms,
    inventory: [...state.inventory, itemId],
    messages: [`You take the ${item.name}.`],
  };
}

function handleDrop(state: GameState, args: string[]): GameState {
  if (args.length === 0) return { ...state, messages: ['Drop what?'] };

  const target = args.join(' ');
  const itemId = findItemInList(state, state.inventory, target);
  if (!itemId) return { ...state, messages: [`You don't have a ${target}.`] };

  const item = state.items.get(itemId)!;
  const room = state.rooms.get(state.currentRoomId);
  if (!room) return { ...state, messages: ['Error: current room not found.'] };

  const updatedRoom: Room = { ...room, items: [...room.items, itemId] };
  const updatedRooms = new Map(state.rooms);
  updatedRooms.set(room.id, updatedRoom);

  return {
    ...state,
    rooms: updatedRooms,
    inventory: state.inventory.filter((id) => id !== itemId),
    messages: [`You drop the ${item.name}.`],
  };
}

function handleInventory(state: GameState): GameState {
  if (state.inventory.length === 0) {
    return { ...state, messages: ["You're not carrying anything."] };
  }
  const list = state.inventory
    .map((id) => state.items.get(id)?.name ?? id)
    .join(', ');
  return { ...state, messages: [`You are carrying: ${list}`] };
}

function handleExamine(state: GameState, args: string[]): GameState {
  if (args.length === 0) return handleLook(state, []);

  const target = args.join(' ');
  const room = state.rooms.get(state.currentRoomId);
  if (!room) return { ...state, messages: ['Error: current room not found.'] };

  const allItemIds = [...room.items, ...state.inventory];
  const itemId = findItemInList(state, allItemIds, target);
  if (itemId) {
    const item = state.items.get(itemId)!;
    return { ...state, messages: [item.description] };
  }

  return { ...state, messages: [`You don't see a ${target} here.`] };
}

function handleUse(state: GameState, args: string[]): GameState {
  if (args.length === 0) return { ...state, messages: ['Use what?'] };

  // Split args on the preposition "on": "use key on chest" → item="key", target="chest"
  const onIndex = args.indexOf('on');
  const itemArgs = onIndex >= 0 ? args.slice(0, onIndex) : args;
  const targetArgs = onIndex >= 0 ? args.slice(onIndex + 1) : [];

  const itemName = itemArgs.join(' ');
  if (!itemName) return { ...state, messages: ['Use what?'] };

  const room = state.rooms.get(state.currentRoomId);
  if (!room) return { ...state, messages: ['Error: current room not found.'] };

  // Items can be used from inventory or from the current room
  const allItemIds = [...state.inventory, ...room.items];
  const itemId = findItemInList(state, allItemIds, itemName);
  if (!itemId) return { ...state, messages: [`You don't have a ${itemName}.`] };

  const item = state.items.get(itemId)!;

  if (!item.onUse || item.onUse.length === 0) {
    return { ...state, messages: [`You can't use the ${item.name} like that.`] };
  }

  if (item.charges !== undefined && item.charges <= 0) {
    return { ...state, messages: [`The ${item.name} has no uses left.`] };
  }

  // Find the matching UseAction
  let action: UseAction | undefined;
  let targetItem: Item | undefined;

  if (targetArgs.length > 0) {
    const targetName = targetArgs.join(' ');
    const targetItemIds = [...room.items, ...state.inventory];
    const targetId = findItemInList(state, targetItemIds, targetName);
    if (!targetId) return { ...state, messages: [`You don't see a ${targetName} here.`] };
    targetItem = state.items.get(targetId);
    const matchingActions = item.onUse.filter((a) => a.targetItemId === targetId);
    if (matchingActions.length === 0) {
      return { ...state, messages: [`You can't use the ${item.name} on the ${targetItem?.name ?? targetName}.`] };
    }
    // Prefer an action whose required item is already in inventory
    action =
      matchingActions.find((a) => !a.requiredItemId || state.inventory.includes(a.requiredItemId)) ??
      matchingActions[0];
  } else {
    const matchingActions = item.onUse.filter((a) => !a.targetItemId);
    if (matchingActions.length === 0) {
      return { ...state, messages: [`You can't use the ${item.name} like that.`] };
    }
    // Prefer an action whose required item is already in inventory
    action =
      matchingActions.find((a) => !a.requiredItemId || state.inventory.includes(a.requiredItemId)) ??
      matchingActions[0];
  }

  // Check required item
  if (action.requiredItemId) {
    if (!state.inventory.includes(action.requiredItemId)) {
      const reqItem = state.items.get(action.requiredItemId);
      return { ...state, messages: [`You need a ${reqItem?.name ?? action.requiredItemId} to do that.`] };
    }
  }

  // Apply effects
  let newState: GameState = { ...state };
  for (const effect of action.effects) {
    newState = applyUseEffect(newState, effect);
  }

  // Decrement charges
  if (item.charges !== undefined) {
    const updatedItem: Item = { ...item, charges: item.charges - 1 };
    const updatedItems = new Map(newState.items);
    updatedItems.set(itemId, updatedItem);
    newState = { ...newState, items: updatedItems };
  }

  // Consume self (remove item being used)
  if (action.consumesSelf) {
    newState = removeItemFromCurrentRoomAndInventory(newState, itemId);
  }

  // Consume required item
  if (action.consumesRequired && action.requiredItemId) {
    newState = removeItemFromCurrentRoomAndInventory(newState, action.requiredItemId);
  }

  return { ...newState, messages: [action.successMessage] };
}

function applyUseEffect(state: GameState, effect: UseEffect): GameState {
  const room = state.rooms.get(state.currentRoomId);
  if (!room) return state;

  switch (effect.type) {
    case 'addItemToRoom': {
      if (room.items.includes(effect.itemId)) return state;
      const updatedRoom: Room = { ...room, items: [...room.items, effect.itemId] };
      const updatedRooms = new Map(state.rooms);
      updatedRooms.set(room.id, updatedRoom);
      return { ...state, rooms: updatedRooms };
    }
    case 'removeItem': {
      const updatedRoom: Room = { ...room, items: room.items.filter((id) => id !== effect.itemId) };
      const updatedRooms = new Map(state.rooms);
      updatedRooms.set(room.id, updatedRoom);
      return {
        ...state,
        rooms: updatedRooms,
        inventory: state.inventory.filter((id) => id !== effect.itemId),
      };
    }
    case 'addExit': {
      const updatedRoom: Room = { ...room, exits: { ...room.exits, [effect.direction]: effect.roomId } };
      const updatedRooms = new Map(state.rooms);
      updatedRooms.set(room.id, updatedRoom);
      return { ...state, rooms: updatedRooms };
    }
    case 'removeExit': {
      const updatedExits = { ...room.exits };
      delete updatedExits[effect.direction];
      const updatedRoom: Room = { ...room, exits: updatedExits };
      const updatedRooms = new Map(state.rooms);
      updatedRooms.set(room.id, updatedRoom);
      return { ...state, rooms: updatedRooms };
    }
    case 'updateRoomDescription': {
      const updatedRoom: Room = { ...room, description: effect.description };
      const updatedRooms = new Map(state.rooms);
      updatedRooms.set(room.id, updatedRoom);
      return { ...state, rooms: updatedRooms };
    }
    default: {
      const _exhaustiveCheck: never = effect;
      return _exhaustiveCheck;
    }
  }
}

function removeItemFromCurrentRoomAndInventory(state: GameState, itemId: string): GameState {
  const room = state.rooms.get(state.currentRoomId);
  if (!room) return state;
  const updatedRoom: Room = { ...room, items: room.items.filter((id) => id !== itemId) };
  const updatedRooms = new Map(state.rooms);
  updatedRooms.set(room.id, updatedRoom);
  return {
    ...state,
    rooms: updatedRooms,
    inventory: state.inventory.filter((id) => id !== itemId),
  };
}

function handleHelp(state: GameState): GameState {
  const msg = [
    'Available commands:',
    '  look (l)              - Describe current room',
    '  look at <item>        - Look at an item',
    '  go <direction>        - Move (north/south/east/west/up/down)',
    '  n/s/e/w/u/d           - Shorthand directions',
    '  take <item>           - Pick up an item',
    '  drop <item>           - Drop an item',
    '  inventory (i)         - Show your inventory',
    '  examine <item>        - Examine an item closely',
    '  use <item>            - Use an item',
    '  use <item> on <item>  - Use an item on another item',
    '  help (?)              - Show this help',
    '  quit (q)              - Quit the game',
  ].join('\n');
  return { ...state, messages: [msg] };
}

function findItemInList(state: GameState, itemIds: string[], target: string): string | null {
  const lower = target.toLowerCase();
  for (const id of itemIds) {
    const item = state.items.get(id);
    if (!item) continue;
    if (
      item.name.toLowerCase() === lower ||
      item.aliases.some((a) => a.toLowerCase() === lower)
    ) {
      return id;
    }
  }
  return null;
}
