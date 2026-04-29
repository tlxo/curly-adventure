---
description: "Add a new item to the game. Prompts for item details and places it in the correct room."
agent: "feature-builder"
argument-hint: "Describe the item (name, what it does, which room it starts in)"
---
Add a new item to the game using the details below.

## Item details

<!-- Fill in or describe to the agent: -->
- **Name**: 
- **Description**: (follow [tone-of-voice](../instructions/tone-of-voice.instructions.md))
- **Aliases**: (alternative words the player can use, e.g. `["key", "small key"]`)
- **Takeable**: yes / no
- **Starting room**: (room ID where the item appears, or "inventory" to start in player's hand)
- **Special notes**: (used to unlock something, consumed on use, etc.)

## Checklist

The agent must:
1. Add the `Item` entry to `src/data/items.ts` using the existing array format.
2. Add the item ID to the `items` array of the correct room in `src/data/rooms.ts`.
3. Confirm the item ID and all aliases are unique across existing items.
4. If the item has a use-effect that requires engine logic, update `src/engine/GameState.ts`.
5. Ensure all narrative text matches the tone of voice.
