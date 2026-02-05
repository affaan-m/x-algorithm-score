import { useState } from 'react';
import { Copy, Check, Sparkles } from 'lucide-react';
import { generateVariants, type TweetVariant } from '../../lib/variant-generator';
import { scoreTweet, parseTweetFeatures } from '../../lib/scoring-engine';
import type { DraftTweet, TweetScore } from '../../types';

interface VariantTesterProps {
  originalText: string;
  originalScore: TweetScore | null;
  hasMedia: boolean;
}

export function VariantTester({ originalText, originalScore, hasMedia }: VariantTesterProps): JSX.Element {
  const [variants, setVariants] = useState<Array<TweetVariant & { score: TweetScore }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    
    // Generate variants
    const generatedVariants = generateVariants(originalText);
    
    // Score each variant
    const scoredVariants = generatedVariants.map(variant => {
      const features = parseTweetFeatures(variant.text);
      const tweet: DraftTweet = {
        text: variant.text,
        hasMedia,
        mediaType: hasMedia ? 'image' : undefined,
        isThread: features.isThread || false,
        hasQuestion: features.hasQuestion || false,
        externalLinks: features.externalLinks || 0,
        hashtags: features.hashtags || 0,
        mentions: features.mentions || 0,
        length: features.length || 0,
        hasEmoji: features.hasEmoji || false,
        hasCallToAction: features.hasCallToAction || false,
        isReply: false,
        quoteTweet: false,
      };
      
      return {
        ...variant,
        score: scoreTweet(tweet),
      };
    });

    setVariants(scoredVariants);
    setIsGenerating(false);
  };

  const handleCopy = (variantId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(variantId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (variants.length === 0) {
    return (
      <div className="variant-tester">
        <button
          className="btn-secondary"
          onClick={handleGenerate}
          disabled={isGenerating || !originalText.trim()}
          style={{ width: '100%' }}
        >
          <Sparkles size={16} />
          {isGenerating ? 'Generating Variants...' : 'Generate A/B Test Variants'}
        </button>
        <p className="variant-helper-text">
          Create alternative versions to test different hooks, CTAs, and formats
        </p>
      </div>
    );
  }

  return (
    <div className="variant-tester">
      <div className="variant-header">
        <h4 className="variant-title">A/B Test Variants</h4>
        <button className="btn-secondary btn-sm" onClick={handleGenerate}>
          Regenerate
        </button>
      </div>

      {/* Original for comparison */}
      <div className="variant-card original">
        <div className="variant-card-header">
          <span className="variant-label">Original</span>
          {originalScore && (
            <span className="variant-score">
              Score: {originalScore.overall} ({originalScore.grade})
            </span>
          )}
        </div>
        <div className="variant-text">{originalText}</div>
      </div>

      {/* Variants */}
      {variants.map((variant) => {
        const scoreDiff = originalScore ? variant.score.overall - originalScore.overall : 0;
        const isImprovement = scoreDiff > 0;
        
        return (
          <div key={variant.id} className="variant-card">
            <div className="variant-card-header">
              <span className="variant-label">{variant.strategy}</span>
              <span className={`variant-score ${isImprovement ? 'positive' : scoreDiff < 0 ? 'negative' : ''}`}>
                Score: {variant.score.overall} ({variant.score.grade})
                {scoreDiff !== 0 && (
                  <span className="score-diff">
                    {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                  </span>
                )}
              </span>
            </div>
            
            <div className="variant-text">{variant.text}</div>
            
            <div className="variant-changes">
              {variant.changes.map((change, idx) => (
                <div key={idx} className="variant-change">• {change}</div>
              ))}
            </div>

            <button
              className="btn-secondary btn-sm"
              onClick={() => handleCopy(variant.id, variant.text)}
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              {copiedId === variant.id ? (
                <>
                  <Check size={14} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
