// Applied in this order (filename timestamps). Generated migrations are reviewed before commit.
import * as m0 from './20261127_165733_initial';
import * as m1 from './20261127_165910_home_section_tags';
import * as m2 from './20261127_170000_audit_append_only';

export const migrations = [
  { up: m0.up, down: m0.down, name: '20261127_165733_initial' },
  { up: m1.up, down: m1.down, name: '20261127_165910_home_section_tags' },
  { up: m2.up, down: m2.down, name: '20261127_170000_audit_append_only' },
];
