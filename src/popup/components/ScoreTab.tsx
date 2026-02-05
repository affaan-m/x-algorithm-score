import { useState } from 'react';
import { Zap, ChevronDown, ChevronUp, FileText, Lightbulb, Loader2, Save, CheckCircle } from 'lucide-react';
import type { TweetScore } from '../../types';
import type { AIAnalysisResult } from '../../lib/ai-analysis';
import { InsightsSection } from './InsightsSection';
import { HistoryPreview } from './HistoryPreview';
import { ScoreGauge } from './ScoreGauge';
import { VariantTester } from './VariantTester';
import { getTopRecommendation } from '../../lib/copy-helpers';
import { sendRuntimeMessage } from '../../lib/runtime';
import { parseTweetFeatures } from '../../lib/scoring-engine';

interface ScoreTabProps {
  text: string;
  setText: (text: string) => void;
  hasMedia: boolean;
  setHasMedia: (hasMedia: boolean) => void;
  score: TweetScore | null;
  aiAnalysis: AIAnalysisResult | null;
  isAnalyzing: boolean;
  aiError: string | null;
  onAnalyze: () => void;
  analyticsEnabled: boolean;
}

export function ScoreTab({
  text,
  setText,
  hasMedia,
  setHasMedia,
  score,
  aiAnalysis,
  isAnalyzing,
  aiError,
  onAnalyze,
  analyticsEnabled,
}: ScoreTabProps): JSX.Element {
  const [showInsights, setShowInsights] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveConfirmation, setSaveConfirmation] = useState<'saved' | 'posted' | null>(null);

  const handleAnalyze = () => {
    setIsLoading(true);
    onAnalyze();
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleSaveToHistory = async () => {
    if (!score || text.trim().length === 0 || !analyticsEnabled) return;
    
    setIsSaving(true);
    try {
      const features = parseTweetFeatures(text);
      const tweetPreview = text.slice(0, 80) + (text.length > 80 ? '...' : '');
      
      const response = await sendRuntimeMessage({
        type: 'LOG_SCORE',
        payload: {
          score: score.overall,
          grade: score.grade,
          predictedReach: score.predictedReach,
          timestamp: Date.now(),
          hasMedia,
          mediaType: hasMedia ? 'image' : undefined,
          externalLinks: features.externalLinks,
          hashtags: features.hashtags,
          mentions: features.mentions,
          length: features.length,
          isThread: features.isThread,
          isReply: false,
          source: 'popup',
          status: 'draft',
          createdAt: Date.now(),
          tweetPreview,
          aiOverallInsight: aiAnalysis?.overallInsight,
          aiOriginalityScore: aiAnalysis?.originality?.score,
          aiAudienceAlignmentScore: aiAnalysis?.audienceAlignment?.score,
        },
      });

      if (response.success && response.id) {
        setSavedEntryId(response.id);
        setSaveConfirmation('saved');
        setTimeout(() => setSaveConfirmation(null), 3000);
      }
    } catch (error) {
      console.error('Failed to save to history:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAsPosted = async () => {
    if (!savedEntryId) return;
    
    setIsSaving(true);
    try {
      await sendRuntimeMessage({
        type: 'UPDATE_HISTORY_ENTRY',
        payload: {
          id: savedEntryId,
          updates: {
            status: 'posted',
            postedAt: Date.now(),
          },
        },
      });

      setSaveConfirmation('posted');
      setTimeout(() => setSaveConfirmation(null), 3000);
    } catch (error) {
      console.error('Failed to mark as posted:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="score-tab">
      {/* Test Area */}
      <div className="test-section">
        <textarea
          className="tweet-input"
          placeholder="What's happening?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
        />
        
        <div className="input-meta">
          <label className="media-checkbox">
            <input
              type="checkbox"
              checked={hasMedia}
              onChange={(e) => setHasMedia(e.target.checked)}
            />
            <span>Has media attached</span>
          </label>
          <span className="char-count">{text.length}/280</span>
        </div>

        {/* Score Display */}
        {score ? (
          <div className="score-result">
            {/* Score Gauge */}
            <ScoreGauge score={score.overall} />
            
            {/* Top Tip */}
            {getTopRecommendation(score) && (
              <div className="top-tip">
                <div className="top-tip-icon">
                  <Lightbulb size={16} />
                </div>
                <div className="top-tip-content">
                  <div className="top-tip-label">Top Tip</div>
                  <div className="top-tip-text">{getTopRecommendation(score)}</div>
                </div>
              </div>
            )}

            {/* AI Analysis Button */}
            {!aiAnalysis && (
              <button
                className="btn-secondary"
                onClick={handleAnalyze}
                disabled={isAnalyzing || isLoading}
                style={{ width: '100%', marginTop: 'var(--space-4)' }}
              >
                {isAnalyzing || isLoading ? (
                  <>
                    <Loader2 size={16} className="spinning" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    AI Analysis
                  </>
                )}
              </button>
            )}

            {/* Save to History / Mark as Posted Buttons */}
            {analyticsEnabled && text.trim().length > 0 && (
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)', flexDirection: 'column' }}>
                {!savedEntryId ? (
                  <button
                    className="btn-secondary"
                    onClick={handleSaveToHistory}
                    disabled={isSaving}
                    style={{ width: '100%' }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="spinning" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save to History
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={handleMarkAsPosted}
                    disabled={isSaving}
                    style={{ width: '100%' }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="spinning" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Mark as Posted
                      </>
                    )}
                  </button>
                )}

                {/* Confirmation Messages */}
                {saveConfirmation === 'saved' && (
                  <div className="success-message" style={{ fontSize: '0.875rem', padding: 'var(--space-2)', textAlign: 'center' }}>
                    <Save size={14} style={{ marginRight: 'var(--space-1)' }} />
                    Saved to History
                  </div>
                )}
                {saveConfirmation === 'posted' && (
                  <div className="success-message" style={{ fontSize: '0.875rem', padding: 'var(--space-2)', textAlign: 'center' }}>
                    <CheckCircle size={14} style={{ marginRight: 'var(--space-1)' }} />
                    Marked as Posted
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={48} strokeWidth={1.5} />
            </div>
            <h3 className="empty-state-title">Start Analyzing</h3>
            <p className="empty-state-description">
              Enter your tweet above to see its algorithm score and get personalized recommendations
            </p>
          </div>
        )}

        {/* AI Analysis Result */}
        {isAnalyzing && !aiAnalysis && (
          <div className="loading-state">
            <div className="loading-spinner">
              <Loader2 size={24} className="spinning" />
            </div>
            <div className="loading-text">
              <div className="loading-title">Analyzing with AI...</div>
              <div className="loading-description">
                Generating personalized insights for your tweet
              </div>
            </div>
          </div>
        )}
        
        {aiAnalysis && (
          <div className="ai-result fade-in">
            <div className="ai-section">
              <div className="ai-section-title">AI Analysis</div>
              <p className="ai-text">{aiAnalysis.overallInsight}</p>
            </div>
            {aiAnalysis.rewriteSuggestions.length > 0 && (
              <div className="ai-section">
                <div className="ai-section-title">Rewrite Suggestions</div>
                <ul className="ai-list">
                  {aiAnalysis.rewriteSuggestions.map((suggestion: { improved: string; explanation: string }, i: number) => (
                    <li key={i}>
                      <strong>{suggestion.improved}</strong>
                      <br />
                      <span style={{fontSize: '0.9em', opacity: 0.8}}>{suggestion.explanation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {aiError && (
          <div className="error-message fade-in">{aiError}</div>
        )}
      </div>

      {/* Algorithm Insights (Collapsible) */}
      <button
        className="insights-toggle"
        onClick={() => setShowInsights(!showInsights)}
      >
        <Zap size={16} />
        <span>Algorithm Insights</span>
        {showInsights ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showInsights && <InsightsSection />}

      {/* A/B Testing Variants */}
      {score && text.trim().length > 0 && (
        <>
          <button
            className="insights-toggle"
            onClick={() => setShowVariants(!showVariants)}
          >
            <Zap size={16} />
            <span>A/B Test Variants</span>
            {showVariants ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showVariants && <VariantTester originalText={text} originalScore={score} hasMedia={hasMedia} />}
        </>
      )}

      {/* History Preview */}
      <HistoryPreview />
    </div>
  );
}
