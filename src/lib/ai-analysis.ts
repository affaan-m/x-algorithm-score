/**
 * AI-Powered Tweet Analysis using Claude API
 *
 * Provides deeper analysis beyond pattern matching:
 * - Originality assessment
 * - Audience alignment
 * - Rewrite suggestions
 * - Engagement prediction reasoning
 */

export interface AIAnalysisResult {
  originality: {
    score: number; // 0-100
    assessment: string;
    similarPatterns?: string[];
  };
  audienceAlignment: {
    score: number;
    targetAudience: string;
    suggestions: string[];
  };
  engagementPrediction: {
    replyLikelihood: 'low' | 'medium' | 'high';
    viralPotential: 'low' | 'medium' | 'high';
    reasoning: string;
  };
  rewriteSuggestions: {
    improved: string;
    explanation: string;
  }[];
  overallInsight: string;
}

export interface AIAnalysisError {
  error: string;
  code: 'NO_API_KEY' | 'API_ERROR' | 'RATE_LIMITED' | 'INVALID_RESPONSE';
}

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are an expert X (Twitter) algorithm analyst. Your job is to analyze draft tweets and provide actionable feedback to maximize reach and engagement.

What we know from xai-org/x-algorithm (verified):
- The ML model predicts probabilities for multiple actions: like, reply, repost, click, share, block, mute, report
- Final score is a weighted combination of these predictions
- Videos need minimum duration to get video quality weight
- Repeated authors get exponentially decaying scores for diversity
- Out-of-network content is downweighted vs in-network

What community research suggests (heuristic):
- Replies appear more valuable for reach than likes
- Responding to your own tweet replies multiplies engagement
- Native video typically shows higher engagement than text
- External links may reduce reach, especially for non-Premium accounts
- Dwell time and early engagement velocity are important
- Questions tend to generate reply engagement

Analyze tweets for:
1. Originality - is this template/generic content?
2. Engagement hooks - will this generate replies and conversation?
3. Audience fit - who would engage with this?
4. Improvement opportunities - specific rewrites

Be concise but actionable. Focus on what will actually improve reach.`;

/**
 * Get API key from Chrome storage
 */
export async function getApiKey(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['claudeApiKey'], (result) => {
        resolve(result.claudeApiKey || null);
      });
    } else {
      // Fallback for testing outside extension context
      resolve(null);
    }
  });
}

/**
 * Validate API key format
 * Claude API keys start with 'sk-ant-' and are typically 108+ characters
 */
export function validateApiKey(apiKey: string): { valid: boolean; error?: string } {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: 'API key cannot be empty' };
  }

  const trimmed = apiKey.trim();

  if (!trimmed.startsWith('sk-ant-')) {
    return { valid: false, error: 'Invalid API key format. Claude API keys start with "sk-ant-"' };
  }

  if (trimmed.length < 50) {
    return { valid: false, error: 'API key appears too short. Please check you copied the full key.' };
  }

  return { valid: true };
}

/**
 * Save API key to Chrome storage (with validation)
 */
export async function saveApiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  const validation = validateApiKey(apiKey);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ claudeApiKey: apiKey.trim() }, () => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: 'Failed to save API key. Storage may be full.' });
        } else {
          resolve({ success: true });
        }
      });
    } else {
      resolve({ success: false, error: 'Storage not available' });
    }
  });
}

/**
 * Analyze tweet with Claude API
 */
export async function analyzeWithClaude(
  tweetText: string,
  context?: {
    hasMedia?: boolean;
    mediaType?: string;
    isPremium?: boolean;
    recentTweets?: string[];
  }
): Promise<AIAnalysisResult | AIAnalysisError> {
  const apiKey = await getApiKey();

  if (!apiKey) {
    return {
      error: 'No API key configured. Add your Claude API key in extension settings.',
      code: 'NO_API_KEY'
    };
  }

  const userPrompt = `Analyze this draft tweet for X (Twitter) algorithm optimization:

"${tweetText}"

Context:
- Has media: ${context?.hasMedia ? `Yes (${context.mediaType})` : 'No'}
- Premium account: ${context?.isPremium ? 'Yes' : 'No/Unknown'}
${context?.recentTweets ? `- Recent tweets by this author:\n${context.recentTweets.slice(0, 3).map(t => `  "${t}"`).join('\n')}` : ''}

Provide your analysis as JSON with this structure:
{
  "originality": {
    "score": <0-100>,
    "assessment": "<brief assessment>",
    "similarPatterns": ["<any detected template patterns>"]
  },
  "audienceAlignment": {
    "score": <0-100>,
    "targetAudience": "<who this appeals to>",
    "suggestions": ["<suggestions to better target>"]
  },
  "engagementPrediction": {
    "replyLikelihood": "<low|medium|high>",
    "viralPotential": "<low|medium|high>",
    "reasoning": "<why>"
  },
  "rewriteSuggestions": [
    {
      "improved": "<rewritten tweet>",
      "explanation": "<why this is better>"
    }
  ],
  "overallInsight": "<one key actionable insight>"
}`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { error: 'Rate limited. Please try again in a moment.', code: 'RATE_LIMITED' };
      }
      const errorText = await response.text();
      return { error: `API error: ${errorText}`, code: 'API_ERROR' };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return { error: 'Empty response from API', code: 'INVALID_RESPONSE' };
    }

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                      content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { error: 'Could not parse API response', code: 'INVALID_RESPONSE' };
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const result = JSON.parse(jsonStr) as AIAnalysisResult;

    return result;
  } catch (err) {
    return {
      error: `Request failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      code: 'API_ERROR'
    };
  }
}

/**
 * Check if result is an error
 */
export function isAIError(result: AIAnalysisResult | AIAnalysisError): result is AIAnalysisError {
  return 'error' in result;
}
