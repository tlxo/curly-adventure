import { Room } from '../types/Room';
import { Item } from '../types/Item';
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

  // Support "pick up <item>"
  const target = args.filter((a) => a !== 'up').join(' ');
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

function handleHelp(state: GameState): GameState {
  const msg = [
    'Available commands:',
    '  look (l)           - Describe current room',
    '  look at <item>     - Look at an item',
    '  go <direction>     - Move (north/south/east/west/up/down)',
    '  n/s/e/w/u/d        - Shorthand directions',
    '  take <item>        - Pick up an item',
    '  drop <item>        - Drop an item',
    '  inventory (i)      - Show your inventory',
    '  examine <item>     - Examine an item closely',
    '  help (?)           - Show this help',
    '  quit (q)           - Quit the game',
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
