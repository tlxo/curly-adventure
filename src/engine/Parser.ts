export type CommandType =
  | 'look'
  | 'go'
  | 'take'
  | 'drop'
  | 'inventory'
  | 'examine'
  | 'help'
  | 'quit'
  | 'unknown';

export interface ParsedCommand {
  type: CommandType;
  args: string[];
  raw: string;
}

const DIRECTION_ALIASES: Record<string, string> = {
  n: 'north',
  s: 'south',
  e: 'east',
  w: 'west',
  u: 'up',
  d: 'down',
};

export function parse(input: string): ParsedCommand {
  const raw = input.trim();
  const tokens = raw.toLowerCase().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return { type: 'unknown', args: [], raw };
  }

  const verb = tokens[0];
  const args = tokens.slice(1);

  switch (verb) {
    case 'look':
    case 'l':
      return { type: 'look', args, raw };

    case 'go':
      return { type: 'go', args, raw };

    case 'north':
    case 'south':
    case 'east':
    case 'west':
    case 'up':
    case 'down':
      return { type: 'go', args: [verb], raw };

    case 'n':
    case 's':
    case 'e':
    case 'w':
    case 'u':
    case 'd':
      return { type: 'go', args: [DIRECTION_ALIASES[verb]], raw };

    case 'take':
    case 'get':
    case 'pick':
      return { type: 'take', args, raw };

    case 'drop':
    case 'put':
      return { type: 'drop', args, raw };

    case 'inventory':
    case 'inv':
    case 'i':
      return { type: 'inventory', args: [], raw };

    case 'examine':
    case 'ex':
    case 'x':
    case 'inspect':
      return { type: 'examine', args, raw };

    case 'help':
    case '?':
      return { type: 'help', args: [], raw };

    case 'quit':
    case 'exit':
    case 'q':
      return { type: 'quit', args: [], raw };

    default:
      return { type: 'unknown', args: tokens.slice(1), raw };
  }
}
