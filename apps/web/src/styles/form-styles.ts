/**
 * Unified form styling constants for consistent UX across all forms
 * - Pay First (ManagedTeamCreation)
 * - Shareable Keys (ShareableKeysCreation)
 * - Collection Invite Pages
 */

export const UNIFIED_FORM_STYLES = {
  // Input field styles with improved size and readability
  input: {
    base: 'glass border-white/20 text-white text-base h-12 px-4',
    large: 'glass border-white/20 text-white text-lg h-14 px-5',
    number: 'glass border-white/20 text-white text-base h-12 px-4 font-mono',
  },

  // Textarea styles with better height and padding
  textarea: {
    base: 'glass border-white/20 text-white text-base p-4 min-h-[100px]',
    small: 'glass border-white/20 text-white text-base p-4 min-h-[80px]',
  },

  // Label styles with consistent sizing
  label: {
    base: 'text-white text-base font-medium',
    withIcon: 'text-white text-base font-medium flex items-center gap-2',
    small: 'text-white text-sm font-medium',
  },

  // Select/Dropdown styles
  select: {
    trigger: 'glass border-white/20 text-white text-base h-12',
    content: 'glass border-white/20',
  },

  // Section spacing
  spacing: {
    section: 'space-y-6',
    fieldGroup: 'space-y-3',
    inlineFields: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    compactInlineFields: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  },

  // Card and container styles
  card: {
    base: 'glass-card',
    header: 'space-y-2',
    content: 'space-y-6 p-6',
  },

  // Button styles
  button: {
    primary: 'gradient-primary text-white hover-glow h-12 text-base font-semibold',
    large: 'gradient-primary text-white hover-glow h-14 text-lg font-semibold',
    outline: 'glass border-white/20 h-12 text-base',
  },

  // Participant/item entry styles
  participantCard: {
    container: 'glass p-5 rounded-lg border border-white/10',
    grid: 'grid grid-cols-1 md:grid-cols-12 gap-4 items-end',
  },

  // Info displays
  info: {
    summary: 'glass p-5 rounded-lg border border-cyan-500/20',
    alert: 'glass p-4 rounded-lg border border-blue-500/20 bg-blue-500/5',
  },
} as const;

// Helper function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};
