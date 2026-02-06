/**
 * Controversy Risk Scanner
 *
 * Detects content patterns that are likely to trigger:
 * - Reports (-369x algorithmic penalty)
 * - Blocks/mutes (-74x penalty)
 * - Mass unfollows (3-month shadowban risk)
 * - Negative feedback signals
 *
 * Categories:
 * 1. Hot-button topics that polarize audiences
 * 2. Inflammatory/aggressive tone
 * 3. Potentially offensive language
 * 4. Engagement-bait that backfires (rage bait)
 * 5. Misinformation-adjacent patterns
 */

export interface ControversyWarning {
  category: ControversyCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  detail: string;
  penalty: number; // Points deducted from risk score
}

export interface ControversyResult {
  riskLevel: 'safe' | 'caution' | 'risky' | 'dangerous';
  riskScore: number; // 0-100 (0 = safe, 100 = maximum risk)
  warnings: ControversyWarning[];
  totalPenalty: number;
}

export type ControversyCategory =
  | 'offensive_language'
  | 'hot_button_topic'
  | 'inflammatory_tone'
  | 'rage_bait'
  | 'misinfo_pattern'
  | 'targeted_attack'
  | 'identity_attack';

// Patterns that frequently trigger reports
const OFFENSIVE_PATTERNS: { pattern: RegExp; severity: ControversyWarning['severity']; detail: string }[] = [
  {
    pattern: /\b(shut\s*up|stfu|gtfo|idiot|moron|dumb\s*ass|stupid\s*(people|person))\b/i,
    severity: 'medium',
    detail: 'Direct insults often trigger blocks/mutes (-74x penalty each)',
  },
  {
    pattern: /\b(kill\s*(yourself|urself|them)|die\s+in|hope\s+you\s+die|death\s+threat)\b/i,
    severity: 'critical',
    detail: 'Violent language triggers reports (-369x) and potential account suspension',
  },
  {
    pattern: /\b(retard(ed)?|spaz|cripple)\b/i,
    severity: 'high',
    detail: 'Ableist language is widely reported and triggers content moderation',
  },
  {
    pattern: /\b(trash\s*(person|people|human)|garbage\s*(person|people|human)|worthless)\b/i,
    severity: 'medium',
    detail: 'Dehumanizing language drives reports and blocks',
  },
];

// Hot-button topics that polarize and drive reports from one side
const HOT_BUTTON_PATTERNS: { pattern: RegExp; severity: ControversyWarning['severity']; detail: string }[] = [
  {
    pattern: /\b(all\s+(men|women|liberals|conservatives|republicans|democrats)\s+(are|should))\b/i,
    severity: 'high',
    detail: 'Broad group generalizations trigger mass reports from the targeted group',
  },
  {
    pattern: /\b(fake\s+news|mainstream\s+media\s+lies|msm\s+is\s+(lying|dead))\b/i,
    severity: 'medium',
    detail: 'Media criticism patterns often get flagged as misinformation',
  },
  {
    pattern: /\b(wake\s+up\s+sheeple|sheep\s+mentality|npcs?\b)/i,
    severity: 'medium',
    detail: 'Dismissive language about others\' intelligence triggers blocks (-74x)',
  },
];

// Inflammatory/aggressive tone markers
const INFLAMMATORY_PATTERNS: { pattern: RegExp; severity: ControversyWarning['severity']; detail: string }[] = [
  {
    pattern: /\b(fight\s+me|come\s+at\s+me|say\s+it\s+to\s+my\s+face|square\s+up)\b/i,
    severity: 'medium',
    detail: 'Confrontational tone drives blocks and mutes rather than constructive replies',
  },
  {
    pattern: /\b(you('re|\s+are)\s+(wrong|an?\s+idiot|stupid|clueless|delusional))\b/i,
    severity: 'high',
    detail: 'Personal attacks on individuals generate reports and blocks at high rates',
  },
  {
    pattern: /\b(everyone\s+who\s+(disagrees|thinks)\s+is\s+(wrong|stupid|an?\s+idiot))\b/i,
    severity: 'high',
    detail: 'Dismissing all disagreement signals toxicity to the algorithm',
  },
  {
    pattern: /(!{3,}|\?{3,}|[A-Z\s]{30,})/,
    severity: 'low',
    detail: 'Excessive caps/punctuation reads as shouting — reduces perceived quality',
  },
];

// Rage bait patterns (designed to provoke, often backfires)
const RAGE_BAIT_PATTERNS: { pattern: RegExp; severity: ControversyWarning['severity']; detail: string }[] = [
  {
    pattern: /\b(ratio|ratio\s*this|you\s+got\s+ratio('d|ed))\b/i,
    severity: 'low',
    detail: 'Ratio culture drives negative engagement — blocks outweigh any reply boost',
  },
  {
    pattern: /\b(cope\s+harder|stay\s+mad|die\s+mad|seethe|cry\s+(about\s+it|more|harder))\b/i,
    severity: 'medium',
    detail: 'Dismissive provocation generates blocks (-74x) far more than positive engagement',
  },
  {
    pattern: /\b(this\s+will\s+trigger|watch\s+them\s+(lose|melt)|gonna\s+make\s+people\s+mad)\b/i,
    severity: 'medium',
    detail: 'Intentional provocation is the fastest path to reports (-369x) and algorithmic debt',
  },
];

// Targeted attack patterns
const TARGETED_ATTACK_PATTERNS: { pattern: RegExp; severity: ControversyWarning['severity']; detail: string }[] = [
  {
    pattern: /@\w+\s+(is\s+(trash|garbage|worst|terrible|a\s+fraud|a\s+scam|lying))\b/i,
    severity: 'high',
    detail: 'Directly attacking named users triggers their followers to report en masse',
  },
  {
    pattern: /\b(doxx|dox|expose\s+them|leak\s+(their|the)\s+(address|info|number))\b/i,
    severity: 'critical',
    detail: 'Doxxing references trigger immediate reports and potential account suspension',
  },
  {
    pattern: /\b(cancel\s+(this|them|her|him)|let's\s+cancel|needs?\s+to\s+be\s+cancelled)\b/i,
    severity: 'high',
    detail: 'Cancel mob calls generate mass reports from the target\'s community',
  },
];

// Misinformation-adjacent patterns
const MISINFO_PATTERNS: { pattern: RegExp; severity: ControversyWarning['severity']; detail: string }[] = [
  {
    pattern: /\b(exposed|exposed!|they\s+don'?t\s+want\s+you\s+to\s+know|the\s+truth\s+(they|about))\b/i,
    severity: 'low',
    detail: 'Conspiracy-adjacent framing may trigger content moderation review',
  },
  {
    pattern: /\b(do\s+your\s+(own\s+)?research|look\s+it\s+up\s+yourself|i'?m\s+just\s+asking\s+questions)\b/i,
    severity: 'low',
    detail: 'JAQ-ing (just asking questions) pattern is flagged by content classifiers',
  },
  {
    pattern: /\b(100%\s+proven|scientifically\s+proven|doctors?\s+(don'?t|won'?t)\s+tell\s+you)\b/i,
    severity: 'medium',
    detail: 'False authority claims on health/science topics trigger community notes and reports',
  },
];

const SEVERITY_PENALTY: Record<ControversyWarning['severity'], number> = {
  low: 2,
  medium: 5,
  high: 10,
  critical: 20,
};

/**
 * Scan tweet text for controversy risk factors.
 *
 * Returns a result with risk level, score, warnings, and total penalty
 * to be integrated into the main scoring engine.
 */
export function scanForControversy(text: string): ControversyResult {
  const warnings: ControversyWarning[] = [];

  const scanPatterns = (
    patterns: { pattern: RegExp; severity: ControversyWarning['severity']; detail: string }[],
    category: ControversyCategory,
    categoryMessage: string
  ) => {
    for (const { pattern, severity, detail } of patterns) {
      if (pattern.test(text)) {
        warnings.push({
          category,
          severity,
          message: categoryMessage,
          detail,
          penalty: SEVERITY_PENALTY[severity],
        });
      }
    }
  };

  scanPatterns(OFFENSIVE_PATTERNS, 'offensive_language', 'Offensive language detected');
  scanPatterns(HOT_BUTTON_PATTERNS, 'hot_button_topic', 'Polarizing topic pattern detected');
  scanPatterns(INFLAMMATORY_PATTERNS, 'inflammatory_tone', 'Inflammatory tone detected');
  scanPatterns(RAGE_BAIT_PATTERNS, 'rage_bait', 'Rage bait pattern detected');
  scanPatterns(TARGETED_ATTACK_PATTERNS, 'targeted_attack', 'Targeted attack pattern detected');
  scanPatterns(MISINFO_PATTERNS, 'misinfo_pattern', 'Misinformation-adjacent pattern detected');

  // Calculate total penalty and risk score
  const totalPenalty = warnings.reduce((sum, w) => sum + w.penalty, 0);
  const riskScore = Math.min(100, totalPenalty * 2.5);

  const riskLevel: ControversyResult['riskLevel'] =
    riskScore >= 60 ? 'dangerous' :
    riskScore >= 30 ? 'risky' :
    riskScore >= 10 ? 'caution' :
    'safe';

  return {
    riskLevel,
    riskScore,
    warnings: warnings.sort((a, b) => SEVERITY_PENALTY[b.severity] - SEVERITY_PENALTY[a.severity]),
    totalPenalty,
  };
}

/** Map risk levels to display colors */
export const RISK_COLORS: Record<ControversyResult['riskLevel'], string> = {
  safe: '#22C55E',
  caution: '#EAB308',
  risky: '#F97316',
  dangerous: '#EF4444',
};

/** Map risk levels to display labels */
export const RISK_LABELS: Record<ControversyResult['riskLevel'], string> = {
  safe: 'Low Risk',
  caution: 'Some Risk',
  risky: 'High Risk',
  dangerous: 'Dangerous',
};
