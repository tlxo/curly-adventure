---
description: "Add a new player command or verb to the parser and game engine."
agent: "feature-builder"
argument-hint: "Describe the command (verb, what it does, example usage)"
---
Add a new command to the game using the details below.

## Command details

<!-- Fill in or describe to the agent: -->
- **Verb(s)**: (primary verb + any short aliases, e.g. `use`, `u`)
- **Arguments**: (what follows the verb, e.g. `<item>`, `<item> on <target>`, or none)
- **Effect**: (what happens in the game world when the command is run)
- **Success message**: (follow [tone-of-voice](../instructions/tone-of-voice.instructions.md))
- **Failure message**: (when the command can't be applied, e.g. "You can't use that here.")
- **Special notes**: (conditions, side-effects, interactions with other commands)

## Checklist

The agent must:
1. Add the new `CommandType` variant to the union in `src/engine/Parser.ts`.
2. Add matching `case` branches in the `parse()` switch for the verb and any aliases.
3. Handle the command in `src/engine/GameState.ts` — implement the game logic and return the appropriate message.
4. Add or update unit tests in `src/__tests__/Parser.test.ts` and/or `GameState.test.ts`.
5. Add the verb to the `help` output so players can discover it.
6. Ensure all player-facing text matches the tone of voice.
