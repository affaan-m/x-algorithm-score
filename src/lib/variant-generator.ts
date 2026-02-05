/**
 * A/B Testing Variant Generator
 * 
 * Generates tweet variants with different structures, hooks, and CTAs
 * for local-only A/B testing and tracking
 */

export interface TweetVariant {
  id: string;
  text: string;
  strategy: string;
  changes: string[];
}

const HOOKS = [
  'Here\'s the thing:',
  'Quick thread:',
  'Let me break this down:',
  'Hot take:',
  'Unpopular opinion:',
  'This is important:',
  'Real talk:',
];

const CTAS = [
  '\n\nWhat do you think?',
  '\n\nThoughts?',
  '\n\nAgree or disagree?',
  '\n\nYour take?',
  '\n\nLet me know in the replies.',
  '\n\nDrop a comment.',
];

const QUESTION_STARTERS = [
  'Ever wondered',
  'Have you noticed',
  'What if',
  'Why do',
  'How can',
];

/**
 * Generate tweet variants for A/B testing
 */
export function generateVariants(originalText: string): TweetVariant[] {
  const variants: TweetVariant[] = [];
  const trimmed = originalText.trim();
  
  if (trimmed.length === 0) {
    return variants;
  }

  // Variant 1: Add a strong hook
  if (!startsWithHook(trimmed)) {
    const hook = HOOKS[Math.floor(Math.random() * HOOKS.length)];
    variants.push({
      id: 'hook',
      text: `${hook}\n\n${trimmed}`,
      strategy: 'Strong Hook',
      changes: ['Added attention-grabbing opening', 'Increases scroll-stopping power'],
    });
  }

  // Variant 2: Add question CTA
  if (!hasQuestion(trimmed)) {
    const cta = CTAS[Math.floor(Math.random() * CTAS.length)];
    variants.push({
      id: 'question-cta',
      text: `${trimmed}${cta}`,
      strategy: 'Question CTA',
      changes: ['Added question to encourage replies', 'Replies are 13-27x more valuable than likes'],
    });
  }

  // Variant 3: Convert to question format
  if (!hasQuestion(trimmed) && trimmed.length < 200) {
    const questionStarter = QUESTION_STARTERS[Math.floor(Math.random() * QUESTION_STARTERS.length)];
    const questionText = `${questionStarter} ${trimmed.toLowerCase().replace(/\.$/, '')}?`;
    variants.push({
      id: 'question-format',
      text: questionText,
      strategy: 'Question Format',
      changes: ['Reframed as a question', 'Questions drive reply engagement'],
    });
  }

  // Variant 4: Break into thread format (if text is long)
  if (trimmed.length > 200 && !trimmed.includes('🧵') && !trimmed.includes('/')) {
    const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 2) {
      const threadText = `${sentences[0].trim()}.\n\n🧵 Thread 👇`;
      variants.push({
        id: 'thread',
        text: threadText,
        strategy: 'Thread Format',
        changes: ['Converted to thread format', 'Threads increase dwell time and reach'],
      });
    }
  }

  // Variant 5: Add numbers/stats (if none present)
  if (!hasNumbers(trimmed) && trimmed.length < 220) {
    variants.push({
      id: 'stats',
      text: `${trimmed}\n\n(Based on recent data)`,
      strategy: 'Add Credibility',
      changes: ['Added credibility signal', 'Data-backed claims perform better'],
    });
  }

  // Return max 3 variants
  return variants.slice(0, 3);
}

function startsWithHook(text: string): boolean {
  const firstLine = text.split('\n')[0].toLowerCase();
  return HOOKS.some(hook => firstLine.includes(hook.toLowerCase().slice(0, -1)));
}

function hasQuestion(text: string): boolean {
  return text.includes('?');
}

function hasNumbers(text: string): boolean {
  return /\d/.test(text);
}

/**
 * Variant testing result for tracking
 */
export interface VariantTestResult {
  originalText: string;
  variants: TweetVariant[];
  selectedVariantId: string | null;
  timestamp: number;
}
