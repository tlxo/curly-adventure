---
description: "Add a new room to the game world. Prompts for room details and wires it into the data and any connecting rooms."
agent: "feature-builder"
argument-hint: "Describe the room (name, atmosphere, exits, any items it should contain)"
---
Add a new room to the game using the details below.

## Room details

<!-- Fill in or describe to the agent: -->
- **Name**: 
- **Description**: (follow [tone-of-voice](../instructions/tone-of-voice.instructions.md))
- **Exits**: (e.g. north → `hallway`, east → `kitchen`)
- **Items**: (list item IDs that start in this room, or "none")
- **Special notes**: (locked doors, dark rooms, triggered events, etc.)

## Checklist

The agent must:
1. Add the `Room` entry to `src/data/rooms.ts` using the existing array format.
2. Update the `exits` of any neighbouring rooms that should link back to this room.
3. If new items are needed for this room, create them in `src/data/items.ts` (or reference the `/add-item` prompt).
4. Confirm the room ID is unique across all existing rooms.
5. Ensure all narrative text matches the tone of voice.
