import * as migration_20261127_165733_initial from './20261127_165733_initial';
import * as migration_20261127_165910_home_section_tags from './20261127_165910_home_section_tags';
import * as migration_20261127_170000_audit_append_only from './20261127_170000_audit_append_only';
import * as migration_20261127_214223_dashboard_review from './20261127_214223_dashboard_review';
import * as migration_20261127_214454_drop_visible_cards from './20261127_214454_drop_visible_cards';
import * as migration_20261127_222909_identity from './20261127_222909_identity';

export const migrations = [
  {
    up: migration_20261127_165733_initial.up,
    down: migration_20261127_165733_initial.down,
    name: '20261127_165733_initial',
  },
  {
    up: migration_20261127_165910_home_section_tags.up,
    down: migration_20261127_165910_home_section_tags.down,
    name: '20261127_165910_home_section_tags',
  },
  {
    up: migration_20261127_170000_audit_append_only.up,
    down: migration_20261127_170000_audit_append_only.down,
    name: '20261127_170000_audit_append_only',
  },
  {
    up: migration_20261127_214223_dashboard_review.up,
    down: migration_20261127_214223_dashboard_review.down,
    name: '20261127_214223_dashboard_review',
  },
  {
    up: migration_20261127_214454_drop_visible_cards.up,
    down: migration_20261127_214454_drop_visible_cards.down,
    name: '20261127_214454_drop_visible_cards',
  },
  {
    up: migration_20261127_222909_identity.up,
    down: migration_20261127_222909_identity.down,
    name: '20261127_222909_identity'
  },
];
