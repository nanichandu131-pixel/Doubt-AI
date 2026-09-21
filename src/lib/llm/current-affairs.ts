export type TimeCategory = 'current' | 'historical' | 'future' | 'none';

export interface TimeSensitivity {
  category: TimeCategory;
  mentionedYear: number | null;
  /** Whether a live web-search tool should be attached to the model call. */
  needsLiveData: boolean;
  /** Whether the response should be anchored to the current date. */
  anchorToday: boolean;
}

const INTERROGATIVE = /\b(who|what|which|when|why|how)\b/i;

const ROLE_HOLDER =
  /\b(cm|pm|chief\s+minister|prime\s+minister|president|vice\s+president|governor|chancellor|minister|senator|mp|mla|mayor|chief\s+justice|justice|judge|ceo|chairperson|chairman|head|secretary|leader|captain|commander|director|general|ambassador|envoy|spokesperson|incumbent|premier|king|queen|emperor|captaincy)\b/i;

const CURRENT_MARKER =
  /\b(currently|current affairs|this\s+year|as\s+of|right\s+now|nowadays|today|presently|latest|recent(?:ly)?|now\b|current\b|present\b)\b/i;

const ELECTRIC_CURRENT =
  /\b(electric(?:al)?\s+current|alternating\s+current|direct\s+current|current\s+(?:flows?|passes?|moves?))\b/i;

const PAST_MARKER = /\b(who\s+was|was\b|were\b|former|previous|first\b|when\s+did|in\s+history|historically|founded|established|century|bc\b|ad\b|ancient|medieval)\b/i;

export function classifyTimeSensitivity(text: string, now: Date = new Date()): TimeSensitivity {
  const currentYear = now.getFullYear();
  const t = text.trim();
  if (!t) return { category: 'none', mentionedYear: null, needsLiveData: false, anchorToday: false };

  const years = [...t.matchAll(/\b(19|20)\d{2}\b/g)]
    .map((m) => parseInt(m[0], 10))
    .filter((y) => y >= 1900 && y <= 2100);
  const mentionedYear = years.length > 0 ? years[0] : null;

  if (years.length > 0) {
    if (years.some((y) => y > currentYear)) {
      return { category: 'future', mentionedYear, needsLiveData: false, anchorToday: true };
    }
    if (years.some((y) => y === currentYear)) {
      return { category: 'current', mentionedYear, needsLiveData: true, anchorToday: true };
    }
    return { category: 'historical', mentionedYear, needsLiveData: false, anchorToday: false };
  }

  const hasCurrentMarker = CURRENT_MARKER.test(t) && !ELECTRIC_CURRENT.test(t);
  if (hasCurrentMarker && (INTERROGATIVE.test(t) || ROLE_HOLDER.test(t))) {
    return { category: 'current', mentionedYear: null, needsLiveData: true, anchorToday: true };
  }

  if (INTERROGATIVE.test(t) && PAST_MARKER.test(t)) {
    return { category: 'historical', mentionedYear: null, needsLiveData: false, anchorToday: false };
  }

  return { category: 'none', mentionedYear: null, needsLiveData: false, anchorToday: false };
}

export function formatFullDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(now);
}

export function formatMonthYear(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);
}

/** Merges time/current-affairs awareness into the base system prompt for a given user message. */
export function buildTimeAwareInstructions(
  base: string,
  text: string,
  now: Date = new Date(),
  hasLiveSearch?: boolean,
): string {
  const sensitivity = classifyTimeSensitivity(text, now);
  if (sensitivity.category === 'none') return base;

  const monthYear = formatMonthYear(now);
  const fullDate = formatFullDate(now);

  let block = `\n\n[CURRENT AFFAIRS CONTEXT]\nToday is ${fullDate}.`;
  switch (sensitivity.category) {
    case 'current':
      block +=
        ` This question depends on CURRENT information. When a fact depends on the present ` +
        `(office-holders, appointments, latest events, statistics, awards, leaders), use the connected web-search tool ` +
        `and anchor time-sensitive facts with "As of ${monthYear}, ...". Never present stale knowledge as current: ` +
        `if the current status cannot be verified, say so clearly and do not invent a holder or fact.`;
      if (!hasLiveSearch) {
        block +=
          ' No live web search is connected in this run. If you cannot verify a present-day fact, explicitly say the current status could not be verified rather than asserting an old holder or statistic as current.';
      }
      break;
    case 'future':
      block +=
        ` This question asks about the future${sensitivity.mentionedYear ? ` (${sensitivity.mentionedYear})` : ''}. ` +
        `Do not assert future facts as certain. Say "As of ${monthYear}, this has not happened yet / cannot be confirmed", ` +
        `then mention only known plans or expectations clearly labeled as projections.`;
      break;
    case 'historical':
      block +=
        ' This question asks about the past. Answer from established historical knowledge and do not present it as current information.';
      break;
  }
  return base + block;
}