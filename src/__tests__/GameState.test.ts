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
