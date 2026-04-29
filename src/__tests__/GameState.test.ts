import { createGameState, processCommand, GameState } from '../engine/GameState';
import { parse } from '../engine/Parser';
import { rooms } from '../data/rooms';
import { items } from '../data/items';

function makeState(): GameState {
  return createGameState(rooms, items, 'room_start');
}

describe('createGameState()', () => {
  test('sets currentRoomId to the start room', () => {
    expect(makeState().currentRoomId).toBe('room_start');
  });

  test('starts with an empty inventory', () => {
    expect(makeState().inventory).toEqual([]);
  });

  test('starts with no messages', () => {
    expect(makeState().messages).toEqual([]);
  });

  test('loads all rooms into the map', () => {
    const state = makeState();
    expect(state.rooms.size).toBe(rooms.length);
  });

  test('loads all items into the map', () => {
    const state = makeState();
    expect(state.items.size).toBe(items.length);
  });
});

describe('processCommand() — look', () => {
  test('look describes the current room name', () => {
    const next = processCommand(makeState(), parse('look'));
    expect(next.messages[0]).toContain('Starting Room');
  });

  test('look lists available exits', () => {
    const next = processCommand(makeState(), parse('look'));
    expect(next.messages[0]).toContain('north');
  });

  test('look lists items in the room', () => {
    const next = processCommand(makeState(), parse('look'));
    expect(next.messages[0]).toContain('key');
  });
});

describe('processCommand() — go', () => {
  test('valid direction moves to the correct room', () => {
    const next = processCommand(makeState(), parse('north'));
    expect(next.currentRoomId).toBe('room_corridor');
  });

  test('moving to a room auto-describes it', () => {
    const next = processCommand(makeState(), parse('north'));
    expect(next.messages[0]).toContain('Corridor');
  });

  test('invalid direction returns an error without moving', () => {
    const next = processCommand(makeState(), parse('go south'));
    expect(next.currentRoomId).toBe('room_start');
    expect(next.messages[0]).toContain("can't go south");
  });

  test('"go" without direction returns an error', () => {
    const next = processCommand(makeState(), parse('go'));
    expect(next.messages[0]).toBe('Go where?');
  });
});

describe('processCommand() — take', () => {
  test('taking a takeable item adds it to inventory', () => {
    const next = processCommand(makeState(), parse('take key'));
    expect(next.inventory).toContain('item_key');
  });

  test('taking an item removes it from the room', () => {
    const next = processCommand(makeState(), parse('take key'));
    const room = next.rooms.get('room_start')!;
    expect(room.items).not.toContain('item_key');
  });

  test('taking a non-takeable item returns an error', () => {
    let state = makeState();
    state = processCommand(state, parse('north'));
    state = processCommand(state, parse('east'));
    const next = processCommand(state, parse('take chest'));
    expect(next.inventory).not.toContain('item_chest');
    expect(next.messages[0]).toContain("can't take");
  });

  test('"take" without target returns an error', () => {
    const next = processCommand(makeState(), parse('take'));
    expect(next.messages[0]).toBe('Take what?');
  });

  test('taking an item not in the room returns an error', () => {
    const next = processCommand(makeState(), parse('take dragon'));
    expect(next.messages[0]).toContain("no dragon");
  });
});

describe('processCommand() — drop', () => {
  test('dropping a carried item places it in the room', () => {
    let state = processCommand(makeState(), parse('take key'));
    state = processCommand(state, parse('drop key'));
    expect(state.inventory).not.toContain('item_key');
    const room = state.rooms.get('room_start')!;
    expect(room.items).toContain('item_key');
  });

  test('"drop" without target returns an error', () => {
    const next = processCommand(makeState(), parse('drop'));
    expect(next.messages[0]).toBe('Drop what?');
  });

  test('dropping an item not in inventory returns an error', () => {
    const next = processCommand(makeState(), parse('drop key'));
    expect(next.messages[0]).toContain("don't have");
  });
});

describe('processCommand() — inventory', () => {
  test('empty inventory produces the empty message', () => {
    const next = processCommand(makeState(), parse('inventory'));
    expect(next.messages[0]).toContain("not carrying anything");
  });

  test('inventory lists carried items', () => {
    let state = processCommand(makeState(), parse('take key'));
    state = processCommand(state, parse('inventory'));
    expect(state.messages[0]).toContain('key');
  });
});

describe('processCommand() — examine', () => {
  test('examining an item in the room shows its description', () => {
    const next = processCommand(makeState(), parse('examine key'));
    expect(next.messages[0]).toContain('key');
  });

  test('examining a carried item shows its description', () => {
    let state = processCommand(makeState(), parse('take key'));
    state = processCommand(state, parse('examine key'));
    expect(state.messages[0]).toContain('key');
  });

  test('examining something that does not exist returns an error', () => {
    const next = processCommand(makeState(), parse('examine dragon'));
    expect(next.messages[0]).toContain("don't see");
  });
});

describe('processCommand() — help', () => {
  test('help lists available commands', () => {
    const next = processCommand(makeState(), parse('help'));
    expect(next.messages[0]).toContain('Available commands');
    expect(next.messages[0]).toContain('look');
    expect(next.messages[0]).toContain('inventory');
  });
});

describe('processCommand() — quit', () => {
  test('quit returns a goodbye message', () => {
    const next = processCommand(makeState(), parse('quit'));
    expect(next.messages[0]).toBe('Goodbye!');
  });
});

describe('processCommand() — unknown', () => {
  test('unknown command returns a helpful error', () => {
    const next = processCommand(makeState(), parse('frobnicate'));
    expect(next.messages[0]).toContain("don't understand");
  });
});

describe('processCommand() — use', () => {
  test('"use" without target returns an error', () => {
    const next = processCommand(makeState(), parse('use'));
    expect(next.messages[0]).toBe('Use what?');
  });

  test('using an item not in inventory or room returns an error', () => {
    const next = processCommand(makeState(), parse('use dragon'));
    expect(next.messages[0]).toContain("don't have");
  });

  test('using an item with no onUse definition returns an error', () => {
    // coin has no onUse
    let state = makeState();
    // Go to the final room where the chest is, use key on it first to get coin
    state = processCommand(state, parse('take key'));
    state = processCommand(state, parse('north'));
    state = processCommand(state, parse('east'));
    state = processCommand(state, parse('use key on chest'));
    // coin is now in the room; take it
    state = processCommand(state, parse('take coin'));
    const next = processCommand(state, parse('use coin'));
    expect(next.messages[0]).toContain("can't use");
  });

  test('using key on chest adds coin to room and removes chest', () => {
    let state = makeState();
    state = processCommand(state, parse('take key'));
    state = processCommand(state, parse('north'));
    state = processCommand(state, parse('east'));
    const next = processCommand(state, parse('use key on chest'));
    const room = next.rooms.get('room_end')!;
    expect(room.items).toContain('item_coin');
    expect(room.items).not.toContain('item_chest');
  });

  test('using key on chest consumes the key', () => {
    let state = makeState();
    state = processCommand(state, parse('take key'));
    state = processCommand(state, parse('north'));
    state = processCommand(state, parse('east'));
    const next = processCommand(state, parse('use key on chest'));
    expect(next.inventory).not.toContain('item_key');
  });

  test('using key on wrong item returns an error', () => {
    let state = makeState();
    state = processCommand(state, parse('take key'));
    const next = processCommand(state, parse('use key on key'));
    expect(next.messages[0]).toContain("can't use");
  });

  test('using an item on a non-existent target returns an error', () => {
    let state = makeState();
    state = processCommand(state, parse('take key'));
    const next = processCommand(state, parse('use key on dragon'));
    expect(next.messages[0]).toContain("don't see");
  });

  test('torch charges are decremented on use', () => {
    const torchItems = [...items, { id: 'item_torch_test', name: 'torch', description: 'A torch.', takeable: true, aliases: [], charges: 3, onUse: [{ successMessage: 'Lit.', effects: [] }] }];
    let state = createGameState(rooms, torchItems, 'room_start');
    // Manually add torch to inventory via a helper state
    state = { ...state, inventory: [...state.inventory, 'item_torch_test'] };
    state = processCommand(state, parse('use torch'));
    expect(state.items.get('item_torch_test')!.charges).toBe(2);
  });

  test('using a depleted item returns an error', () => {
    const depletedItems = [...items, { id: 'item_depleted', name: 'widget', description: 'A widget.', takeable: true, aliases: [], charges: 0, onUse: [{ successMessage: 'Done.', effects: [] }] }];
    let state = createGameState(rooms, depletedItems, 'room_start');
    state = { ...state, inventory: [...state.inventory, 'item_depleted'] };
    const next = processCommand(state, parse('use widget'));
    expect(next.messages[0]).toContain('no uses left');
  });

  test('using an item with a missing required item returns an error', () => {
    const chainsaw = { id: 'item_chainsaw', name: 'chainsaw', description: 'A chainsaw.', takeable: true, aliases: [], onUse: [{ targetItemId: 'item_chest', requiredItemId: 'item_gas', successMessage: 'Revved.', effects: [] }] };
    const gas = { id: 'item_gas', name: 'gas', description: 'A gas canister.', takeable: true, aliases: [] };
    const testItems = [...items, chainsaw, gas];
    let state = createGameState(rooms, testItems, 'room_start');
    state = processCommand(state, parse('north'));
    state = processCommand(state, parse('east'));
    // Add chainsaw to inventory, chest is in room_end, no gas
    state = { ...state, inventory: [...state.inventory, 'item_chainsaw'] };
    const next = processCommand(state, parse('use chainsaw on chest'));
    expect(next.messages[0]).toContain('need a gas');
  });

  test('using an item with a required item works when required item is present', () => {
    const chainsaw = { id: 'item_chainsaw2', name: 'saw', description: 'A saw.', takeable: true, aliases: [], onUse: [{ targetItemId: 'item_chest', requiredItemId: 'item_gas2', successMessage: 'Revved successfully.', effects: [{ type: 'removeItem' as const, itemId: 'item_chest' }], consumesRequired: true }] };
    const gas = { id: 'item_gas2', name: 'fuel', description: 'Fuel.', takeable: true, aliases: [] };
    const testItems = [...items, chainsaw, gas];
    let state = createGameState(rooms, testItems, 'room_start');
    state = processCommand(state, parse('north'));
    state = processCommand(state, parse('east'));
    state = { ...state, inventory: [...state.inventory, 'item_chainsaw2', 'item_gas2'] };
    const next = processCommand(state, parse('use saw on chest'));
    expect(next.messages[0]).toContain('Revved successfully');
    // Gas is consumed
    expect(next.inventory).not.toContain('item_gas2');
    // Chest removed from room
    const room = next.rooms.get('room_end')!;
    expect(room.items).not.toContain('item_chest');
  });

  test('addExit effect adds a new exit to the current room', () => {
    const lamp = { id: 'item_lamp', name: 'lamp', description: 'A lamp.', takeable: true, aliases: [], onUse: [{ successMessage: 'Light floods the room, revealing a passage.', effects: [{ type: 'addExit' as const, direction: 'south' as const, roomId: 'room_start' }] }] };
    const testItems = [...items, lamp];
    let state = createGameState(rooms, testItems, 'room_start');
    state = { ...state, inventory: [...state.inventory, 'item_lamp'] };
    state = processCommand(state, parse('north'));
    state = processCommand(state, parse('east'));
    const next = processCommand(state, parse('use lamp'));
    const room = next.rooms.get('room_end')!;
    expect(room.exits['south']).toBe('room_start');
  });

  test('removeExit effect removes an existing exit from the current room', () => {
    const blocker = { id: 'item_blocker', name: 'blocker', description: 'A blocker.', takeable: true, aliases: [], onUse: [{ successMessage: 'The passage to the south is sealed.', effects: [{ type: 'removeExit' as const, direction: 'south' as const }] }] };
    const testItems = [...items, blocker];
    let state = createGameState(rooms, testItems, 'room_start');
    state = { ...state, inventory: [...state.inventory, 'item_blocker'] };
    state = processCommand(state, parse('north'));
    // corridor has a south exit initially
    expect(state.rooms.get('room_corridor')!.exits['south']).toBe('room_start');
    const next = processCommand(state, parse('use blocker'));
    expect(next.rooms.get('room_corridor')!.exits['south']).toBeUndefined();
  });

  test('selects action with satisfied requiredItemId over one whose requirement is missing', () => {
    // Two no-target actions on the same item: one requires 'item_gas3' (absent), one requires nothing
    const multitool = {
      id: 'item_multitool',
      name: 'multitool',
      description: 'A multitool.',
      takeable: true,
      aliases: [],
      onUse: [
        { requiredItemId: 'item_gas3', successMessage: 'Power mode.', effects: [] },
        { successMessage: 'Basic mode.', effects: [] },
      ],
    };
    const testItems = [...items, multitool];
    let state = createGameState(rooms, testItems, 'room_start');
    state = { ...state, inventory: [...state.inventory, 'item_multitool'] };
    // item_gas3 is not in inventory → should pick the no-requirement action
    const next = processCommand(state, parse('use multitool'));
    expect(next.messages[0]).toContain('Basic mode');
  });

  test('selects targeted action with satisfied requiredItemId over one whose requirement is missing', () => {
    // Two actions targeting item_chest: one needs absent item_gas4, one needs nothing
    const dualtool = {
      id: 'item_dualtool',
      name: 'dualtool',
      description: 'A dualtool.',
      takeable: true,
      aliases: [],
      onUse: [
        { targetItemId: 'item_chest', requiredItemId: 'item_gas4', successMessage: 'Power open.', effects: [] },
        { targetItemId: 'item_chest', successMessage: 'Basic open.', effects: [] },
      ],
    };
    const testItems = [...items, dualtool];
    let state = createGameState(rooms, testItems, 'room_start');
    state = processCommand(state, parse('north'));
    state = processCommand(state, parse('east'));
    state = { ...state, inventory: [...state.inventory, 'item_dualtool'] };
    // item_gas4 not in inventory → should pick the no-requirement action
    const next = processCommand(state, parse('use dualtool on chest'));
    expect(next.messages[0]).toContain('Basic open');
  });
});
