import { parse } from '../engine/Parser';

describe('parse()', () => {
  describe('look', () => {
    test('"look" → look with no args', () => {
      expect(parse('look')).toEqual({ type: 'look', args: [], raw: 'look' });
    });

    test('"l" → look shorthand', () => {
      expect(parse('l')).toEqual({ type: 'look', args: [], raw: 'l' });
    });

    test('"look at key" → look with args', () => {
      expect(parse('look at key')).toEqual({ type: 'look', args: ['at', 'key'], raw: 'look at key' });
    });
  });

  describe('go', () => {
    test('"go north" → go with direction', () => {
      expect(parse('go north')).toEqual({ type: 'go', args: ['north'], raw: 'go north' });
    });

    test('"north" → go north (bare direction)', () => {
      expect(parse('north')).toEqual({ type: 'go', args: ['north'], raw: 'north' });
    });

    test('"n" → go north (alias)', () => {
      expect(parse('n')).toEqual({ type: 'go', args: ['north'], raw: 'n' });
    });

    test('"s" → go south', () => {
      expect(parse('s')).toEqual({ type: 'go', args: ['south'], raw: 's' });
    });

    test('"e" → go east', () => {
      expect(parse('e')).toEqual({ type: 'go', args: ['east'], raw: 'e' });
    });

    test('"w" → go west', () => {
      expect(parse('w')).toEqual({ type: 'go', args: ['west'], raw: 'w' });
    });

    test('"u" → go up', () => {
      expect(parse('u')).toEqual({ type: 'go', args: ['up'], raw: 'u' });
    });

    test('"d" → go down', () => {
      expect(parse('d')).toEqual({ type: 'go', args: ['down'], raw: 'd' });
    });
  });

  describe('take', () => {
    test('"take key" → take', () => {
      expect(parse('take key')).toEqual({ type: 'take', args: ['key'], raw: 'take key' });
    });

    test('"get key" → take', () => {
      expect(parse('get key')).toEqual({ type: 'take', args: ['key'], raw: 'get key' });
    });

    test('"pick up key" → take', () => {
      expect(parse('pick up key')).toEqual({ type: 'take', args: ['up', 'key'], raw: 'pick up key' });
    });
  });

  describe('drop', () => {
    test('"drop key" → drop', () => {
      expect(parse('drop key')).toEqual({ type: 'drop', args: ['key'], raw: 'drop key' });
    });
  });

  describe('inventory', () => {
    test('"inventory" → inventory', () => {
      expect(parse('inventory')).toEqual({ type: 'inventory', args: [], raw: 'inventory' });
    });

    test('"inv" → inventory', () => {
      expect(parse('inv')).toEqual({ type: 'inventory', args: [], raw: 'inv' });
    });

    test('"i" → inventory', () => {
      expect(parse('i')).toEqual({ type: 'inventory', args: [], raw: 'i' });
    });
  });

  describe('examine', () => {
    test('"examine key" → examine', () => {
      expect(parse('examine key')).toEqual({ type: 'examine', args: ['key'], raw: 'examine key' });
    });

    test('"x key" → examine shorthand', () => {
      expect(parse('x key')).toEqual({ type: 'examine', args: ['key'], raw: 'x key' });
    });
  });

  describe('help', () => {
    test('"help" → help', () => {
      expect(parse('help')).toEqual({ type: 'help', args: [], raw: 'help' });
    });

    test('"?" → help', () => {
      expect(parse('?')).toEqual({ type: 'help', args: [], raw: '?' });
    });
  });

  describe('quit', () => {
    test('"quit" → quit', () => {
      expect(parse('quit')).toEqual({ type: 'quit', args: [], raw: 'quit' });
    });

    test('"q" → quit', () => {
      expect(parse('q')).toEqual({ type: 'quit', args: [], raw: 'q' });
    });
  });

  describe('unknown / edge cases', () => {
    test('unrecognised verb → unknown', () => {
      expect(parse('frobnicate')).toEqual({ type: 'unknown', args: [], raw: 'frobnicate' });
    });

    test('empty input → unknown with empty raw', () => {
      expect(parse('')).toEqual({ type: 'unknown', args: [], raw: '' });
    });

    test('whitespace-only input → unknown with empty raw', () => {
      expect(parse('   ')).toEqual({ type: 'unknown', args: [], raw: '' });
    });

    test('leading/trailing whitespace is trimmed in raw', () => {
      expect(parse('  look  ')).toEqual({ type: 'look', args: [], raw: 'look' });
    });

    test('parsing is case-insensitive and preserves raw input', () => {
      expect(parse('LOOK')).toEqual({ type: 'look', args: [], raw: 'LOOK' });
    });
  });
});
