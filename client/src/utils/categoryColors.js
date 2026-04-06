const CATEGORY_COLORS = {
  'Rent':                '#EF4444',
  'Debt':                '#DC2626',
  'Banking':             '#F87171',
  'Transfer':            '#FB923C',
  'Services':            '#F59E0B',

  'Groceries':           '#22C55E',
  'Food':                '#4ADE80',
  'Food Delivery':       '#16A34A',
  'Restaurant':          '#15803D',
  'Fast Food':           '#86EFAC',

  'Education':           '#3B82F6',
  'Subscription':        '#6366F1',

  'Transport':           '#06B6D4',
  'Travel':              '#0EA5E9',
  'Telecommunications':  '#38BDF8',

  'Shopping':            '#A78BFA',
  'Entertainment':       '#8B5CF6',
  'Convenience':         '#C084FC',

  'Healthcare':          '#EC4899',
  'Vet':                 '#F472B6',

  'Home Improvement':    '#FBBF24',
  'Miscellaneous':       '#94A3B8',
  'Uncategorized':       '#64748B',
};

const FALLBACK_COLORS = [
  '#D946EF', '#14B8A6', '#A3E635', '#FB7185', '#818CF8',
  '#2DD4BF', '#FACC15', '#34D399', '#F97316', '#22D3EE',
];

export function getCategoryColor(category, index) {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export default CATEGORY_COLORS;
