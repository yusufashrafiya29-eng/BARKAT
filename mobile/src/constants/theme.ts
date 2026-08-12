export const COLORS = {
  // Primary Brand
  primary: '#4f46e5',        // Indigo-600
  primaryDark: '#3730a3',    // Indigo-800
  primaryLight: '#818cf8',   // Indigo-400
  primaryBg: '#eef2ff',      // Indigo-50
  primaryBorder: '#c7d2fe',  // Indigo-200

  // Backgrounds
  background: '#f8fafc',     // Slate-50
  card: '#ffffff',
  cardHover: '#f8fafc',

  // Text
  text: '#0f172a',           // Slate-900
  textSecondary: '#334155',  // Slate-700
  textMuted: '#64748b',      // Slate-500
  textLight: '#94a3b8',      // Slate-400

  // Borders
  border: '#e2e8f0',         // Slate-200
  borderLight: '#f1f5f9',    // Slate-100

  // Status Colors (table & order states)
  free: { bg: '#ffffff', border: '#e2e8f0', dot: '#cbd5e1', text: '#64748b', label: 'Free' },
  customer: { bg: '#eef2ff', border: '#a5b4fc', dot: '#6366f1', text: '#4338ca', label: '⚡ New Order' },
  running: { bg: '#fffbeb', border: '#fcd34d', dot: '#f59e0b', text: '#b45309', label: '🔥 Running' },
  printed: { bg: '#ecfdf5', border: '#6ee7b7', dot: '#10b981', text: '#065f46', label: '🖨️ Bill Printed' },
  reserved: { bg: '#fffbeb', border: '#fde68a', dot: '#fbbf24', text: '#d97706', label: 'Reserved' },

  // Order Status Colors
  pending: { bg: '#fffbeb', text: '#b45309', border: '#fcd34d', dot: '#f59e0b' },
  accepted: { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe', dot: '#6366f1' },
  preparing: { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff', dot: '#a855f7' },
  ready: { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7', dot: '#10b981' },
  served: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', dot: '#94a3b8' },
  cancelled: { bg: '#fff1f2', text: '#be123c', border: '#fecdd3', dot: '#f43f5e' },

  // Semantic
  success: '#10b981',        // Emerald-500
  warning: '#f59e0b',        // Amber-500
  danger: '#ef4444',         // Red-500
  info: '#3b82f6',           // Blue-500

  // Dietary
  veg: '#10b981',
  nonVeg: '#ef4444',
};

export const SHADOWS = {
  xs: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 5,
  },
  lg: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const FONT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;
