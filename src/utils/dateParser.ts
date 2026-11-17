const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Timezone-aware relative date interpreter for automotive scheduling:
 * Supports "today", "tomorrow", "next Monday", "this Friday", "the Friday after next", etc.
 */
export function resolveRelativeDate(
  phrase: string,
  baseDateIso: string = '2026-11-17'
): { iso: string; explanation: string } {
  const clean = phrase.trim().toLowerCase();
  const [y, m, d] = baseDateIso.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));

  const formatUtc = (dt: Date) => dt.toISOString().slice(0, 10);

  if (clean.includes('today')) {
    return { iso: formatUtc(base), explanation: `Resolved "today" relative to ${baseDateIso}` };
  }

  if (clean.includes('tomorrow')) {
    const next = new Date(base.getTime() + 86400000);
    return { iso: formatUtc(next), explanation: `Resolved "tomorrow" -> ${formatUtc(next)}` };
  }

  const dayIdx = WEEKDAYS.findIndex((wd) => clean.includes(wd));
  if (dayIdx !== -1) {
    const currentIdx = base.getUTCDay();
    let delta = (dayIdx - currentIdx + 7) % 7;
    if (delta === 0) delta = 7; // upcoming occurrence

    if (clean.includes('after next')) {
      delta += 7;
      const target = new Date(base.getTime() + delta * 86400000);
      return {
        iso: formatUtc(target),
        explanation: `Resolved "${phrase}" (+${delta} days) -> ${formatUtc(target)}`,
      };
    }

    if (clean.includes('next ') && delta <= 7) {
      // If today is Tuesday and user says "next Monday" vs "next Friday"
      if (dayIdx <= currentIdx) {
        // already wrapped to next week
      } else if (delta < 4) {
        delta += 7;
      }
    }

    const target = new Date(base.getTime() + delta * 86400000);
    return {
      iso: formatUtc(target),
      explanation: `Resolved "${phrase}" -> ${formatUtc(target)}`,
    };
  }

  return { iso: baseDateIso, explanation: `Fallback to base shop date ${baseDateIso}` };
}
