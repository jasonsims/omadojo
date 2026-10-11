import './basics.js';
import './tiling.js';
import './workspaces.js';
import './groups.js';
import './apps.js';
import './system.js';

// Importing this module registers every shortcut, deck by deck, in cheat-sheet order.
// Code outside src/actions/ imports the table from here so it is never empty.
export { ACTS, BIND, DECKS, runAction } from './act.js';
