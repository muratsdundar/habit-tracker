export const STAGES = [
  { max: 2, emoji: '🌱', titleKey: 'zen.stage.seed', next: 3, messageKey: 'zen.msg.seed' },
  { max: 6, emoji: '🌿', titleKey: 'zen.stage.sprout', next: 7, messageKey: 'zen.msg.sprout' },
  { max: 14, emoji: '🪴', titleKey: 'zen.stage.sapling', next: 15, messageKey: 'zen.msg.sapling' },
  { max: 29, emoji: '🌸', titleKey: 'zen.stage.flower', next: 30, messageKey: 'zen.msg.flower' },
  { max: Infinity, emoji: '🌳', titleKey: 'zen.stage.tree', next: null, messageKey: 'zen.msg.tree' }
];
