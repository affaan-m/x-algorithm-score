import { useState, useEffect } from 'react';
import { BarChart3, Download, Trash2, TrendingUp, TrendingDown, Image, Video, Link as LinkIcon, Hash, AtSign } from 'lucide-react';
import { isChromeStorageAvailable, sendRuntimeMessage } from '../../lib/runtime';
import type { ScoreLogEntry } from '../../types';

export function HistoryTab(): JSX.Element {
  const [history, setHistory] = useState<ScoreLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = () => {
    if (!isChromeStorageAvailable()) {
      setIsLoading(false);
      return;
    }
    
    chrome.storage.local.get('scoreHistory', (result) => {
      setHistory((result.scoreHistory as ScoreLogEntry[] | undefined) || []);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadHistory();

    // Subscribe to storage changes
    if (!isChromeStorageAvailable()) return;

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName !== 'local') return;
      if (changes.scoreHistory) {
        setHistory((changes.scoreHistory.newValue as ScoreLogEntry[] | undefined) || []);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all score history? This action cannot be undone.')) {
      return;
    }

    try {
      await sendRuntimeMessage({ type: 'CLEAR_HISTORY' });
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const handleExportHistory = async () => {
    try {
      const response = await sendRuntimeMessage({ type: 'EXPORT_HISTORY' });
      const data = response.data;

      if (!data || data.length === 0) {
        alert('No history data to export');
        return;
      }

      // Convert to CSV
      const headers = ['Date', 'Time', 'Score', 'Grade', 'Predicted Reach (Low)', 'Predicted Reach (High)', 'Has Media', 'Media Type', 'External Links', 'Hashtags', 'Mentions', 'Length', 'Is Thread', 'Is Reply'];
      const rows = data.map(entry => {
        const date = new Date(entry.timestamp);
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          entry.score,
          entry.grade,
          entry.predictedReach.low,
          entry.predictedReach.high,
          entry.hasMedia ? 'Yes' : 'No',
          entry.mediaType || 'None',
          entry.externalLinks || 0,
          entry.hashtags || 0,
          entry.mentions || 0,
          entry.length || 0,
          entry.isThread ? 'Yes' : 'No',
          entry.isReply ? 'Yes' : 'No',
        ].join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `x-algorithm-score-history-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export history:', error);
      alert('Failed to export history. Please try again.');
    }
  };

  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  // Calculate stats
  const avgScore = history.length > 0 
    ? Math.round(history.reduce((sum, entry) => sum + entry.score, 0) / history.length)
    : 0;
  
  const recentScores = sortedHistory.slice(0, 10).map(e => e.score);
  const olderScores = sortedHistory.slice(10, 20).map(e => e.score);
  const recentAvg = recentScores.length > 0 
    ? Math.round(recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length)
    : 0;
  const olderAvg = olderScores.length > 0
    ? Math.round(olderScores.reduce((sum, s) => sum + s, 0) / olderScores.length)
    : 0;
  const trend = recentAvg > olderAvg ? 'up' : recentAvg < olderAvg ? 'down' : 'stable';

  if (isLoading) {
    return (
      <div className="history-tab">
        <div className="empty-state">
          <div className="empty-state-icon">
            <BarChart3 size={48} strokeWidth={1.5} />
          </div>
          <p className="empty-state-description">Loading history...</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="history-tab">
        <div className="empty-state">
          <div className="empty-state-icon">
            <BarChart3 size={48} strokeWidth={1.5} />
          </div>
          <h3 className="empty-state-title">No History Yet</h3>
          <p className="empty-state-description">
            Enable "Save score history" in Settings and post some tweets to start tracking your scores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-tab">
      {/* Stats Summary */}
      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-value">{history.length}</div>
          <div className="stat-label">Total Tweets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgScore}</div>
          <div className="stat-label">Avg Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-trend">
            {trend === 'up' && <TrendingUp size={16} className="trend-up" />}
            {trend === 'down' && <TrendingDown size={16} className="trend-down" />}
            {trend === 'stable' && <span>—</span>}
          </div>
          <div className="stat-label">Trend</div>
        </div>
      </div>

      {/* Actions */}
      <div className="history-actions">
        <button className="btn-secondary btn-sm" onClick={handleExportHistory}>
          <Download size={14} />
          Export CSV
        </button>
        <button className="btn-secondary btn-sm" onClick={handleClearHistory}>
          <Trash2 size={14} />
          Clear All
        </button>
      </div>

      {/* History List */}
      <div className="history-list-full">
        {sortedHistory.map((entry, index) => (
          <HistoryEntryCard key={index} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function HistoryEntryCard({ entry }: { entry: ScoreLogEntry }): JSX.Element {
  const date = new Date(entry.timestamp);
  const gradeColor = getGradeColor(entry.grade);

  return (
    <div className="history-entry-card">
      <div className="history-entry-header">
        <div className="history-entry-date">
          <div className="history-entry-time">{date.toLocaleTimeString()}</div>
          <div className="history-entry-day">{date.toLocaleDateString()}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {entry.status && (
            <span 
              style={{ 
                fontSize: '0.75rem', 
                padding: '2px 8px', 
                borderRadius: '12px',
                backgroundColor: entry.status === 'posted' ? '#16a34a20' : '#ca8a0420',
                color: entry.status === 'posted' ? '#16a34a' : '#ca8a04',
                fontWeight: 500,
              }}
            >
              {entry.status === 'posted' ? 'Posted' : 'Draft'}
            </span>
          )}
          <div className="history-entry-score" style={{ color: gradeColor }}>
            <span className="score-value">{entry.score}</span>
            <span className="score-grade">{entry.grade}</span>
          </div>
        </div>
      </div>

      {entry.tweetPreview && (
        <div style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-secondary)', 
          marginTop: 'var(--space-2)',
          fontStyle: 'italic',
          lineHeight: 1.4,
        }}>
          "{entry.tweetPreview}"
        </div>
      )}

      {entry.aiOverallInsight && (
        <div style={{ 
          fontSize: '0.8rem', 
          color: 'var(--accent)', 
          marginTop: 'var(--space-2)',
          padding: 'var(--space-2)',
          backgroundColor: 'var(--accent-bg)',
          borderRadius: 'var(--radius-md)',
          lineHeight: 1.4,
        }}>
          💡 {entry.aiOverallInsight}
        </div>
      )}

      <div className="history-entry-meta">
        {entry.hasMedia && (
          <div className="meta-badge">
            {entry.mediaType === 'video' && <Video size={12} />}
            {entry.mediaType === 'image' && <Image size={12} />}
            {entry.mediaType !== 'video' && entry.mediaType !== 'image' && <Image size={12} />}
            <span>{entry.mediaType || 'media'}</span>
          </div>
        )}
        {entry.externalLinks && entry.externalLinks > 0 && (
          <div className="meta-badge">
            <LinkIcon size={12} />
            <span>{entry.externalLinks} link{entry.externalLinks > 1 ? 's' : ''}</span>
          </div>
        )}
        {entry.hashtags && entry.hashtags > 0 && (
          <div className="meta-badge">
            <Hash size={12} />
            <span>{entry.hashtags}</span>
          </div>
        )}
        {entry.mentions && entry.mentions > 0 && (
          <div className="meta-badge">
            <AtSign size={12} />
            <span>{entry.mentions}</span>
          </div>
        )}
        {entry.length && (
          <div className="meta-badge">
            <span>{entry.length} chars</span>
          </div>
        )}
      </div>

      <div className="history-entry-reach">
        Predicted: {entry.predictedReach.low.toLocaleString()}–{entry.predictedReach.high.toLocaleString()} impressions
      </div>
    </div>
  );
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'S':
    case 'A':
      return '#16a34a';
    case 'B':
      return '#ca8a04';
    case 'C':
    case 'D':
      return '#ea580c';
    case 'F':
      return '#dc2626';
    default:
      return '#536471';
  }
}
