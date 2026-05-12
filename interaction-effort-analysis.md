# Interaction Effort Analysis

- Date: May 12, 2026
- Interface URL: http://localhost:8080/
- Product: Curly Adventure

## Task Framing

- Task: Play a command-driven text adventure loop (read state, enter command, interpret feedback).
- User profile: Novice and routine endpoints.
- Frequency / duration (inferred): Repeated micro-actions every few seconds within a session of roughly 10-30 minutes.
- Input modes: Keyboard and mouse.
- Fidelity: Polished running interface at http://localhost:8080/.
- Completion criterion (inferred): Command acknowledged by the interface and player verifies the resulting world state text.

## Infer, Surface, Proceed

1. Infer context
- Primary workflow is a repeated command loop.
- Most sessions are many short cycles, so cumulative cost matters more than one-off step speed.
- Stakes are low to medium (gameplay confusion, not safety/financial harm).

2. Surface assumptions
- Routine players optimize for rhythm and low friction.
- Novices need discoverability of valid commands and clear parse errors.
- Success means both command acceptance and understandable state update.

3. Proceed
- Enough context was available from live interaction, including success and failure paths (help, invalid command, movement).

## Flow Summary

This interface is efficient for routine users because the core action is a single text field with immediate feedback. The main effort costs are comprehension-heavy: players repeatedly parse dense output blocks and remember command grammar. Time per loop is low for experts, but novice performance is constrained by command recall and output scanning rather than click/typing mechanics.

## Step-by-Step

### 1. Orient to current state (orientation + comprehension)
- What happens: Player scans room description, exits, items, and recent history.
- Routine time: about 0.7-1.8s for a familiar state; 2.5-6s when output grows.
- Novice time: about 3-8s.
- Risk:
- Slip risk: low (nothing destructive).
- Mistake risk: medium (missed exit/item in dense text).

### 2. Select interaction channel (selection)
- What happens: Focus is effectively always on one command input, with optional Enter button.
- Routine time: about 0.2-0.6s.
- Novice time: about 0.5-1.2s.
- Risk:
- Slip risk: low.
- Mistake risk: low.

### 3. Enter command string (tap input)
- What happens: Player types commands like help, go north, take key.
- Routine time: about 0.6-1.5s for short commands.
- Novice time: about 1.5-4s.
- Risk:
- Slip risk: medium (typos).
- Mistake risk: medium-high (wrong verb/syntax, invalid phrasing).

### 4. Submit command (selection or keyboard action)
- What happens: Press Enter key or click button.
- Routine time: about 0.1-0.4s.
- Novice time: about 0.3-0.8s.
- Risk:
- Slip risk: low.
- Mistake risk: low.

### 5. Verify parser feedback and resulting state (comprehension, verify)
- What happens: Read either success state update or fallback error text.
- Routine time: about 0.8-2.5s.
- Novice time: about 2-6s.
- Risk:
- Slip risk: low.
- Mistake risk: medium (not realizing why command failed, or not noticing state change).

## Workflow Economics

- Dominant cumulative cost:
- Repeated read-parse-remember cycles dominate overall effort, not motor actions.
- Switch ledger:
- Low modality switching (mostly keyboard and visual reading), which is good.
- State carryover:
- High working-memory demand over time because command validity depends on remembered world state and command vocabulary.
- Accumulated risk:
- Novices accumulate interpretation mistakes (what can I do now?) more than input slips.
- Routine users mainly lose time when output history becomes long and scanning overhead rises.

## Aggregate Concerns

### Motor Fatigue

Nothing major to report for typical sessions. Input is short and intermittent; physical strain is low unless sessions are very long.

### Cognitive Load

Moderate and sustained. The loop imposes ongoing comprehension and recall demands:

- Recall of command grammar and synonyms.
- Parsing multi-line feedback blocks.
- Tracking world state across history.

This is acceptable for genre expectations, but it is the primary effort limiter.

## Design Observations

1. Good efficiency baseline: one persistent input and immediate textual response keeps action cost low.
2. The highest effort tax is information density in output history, not control complexity.
3. Invalid-command handling is clear and polite, but still leaves repair effort on the player (they must infer correct syntax).
4. Command discoverability depends heavily on remembering help output; this elevates novice cognitive load over time.
5. Two submit paths (Enter key and button) are useful, but keyboard-first flow is clearly the fastest for routine play.
