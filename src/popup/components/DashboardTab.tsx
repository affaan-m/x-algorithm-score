import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Target, Clock, CheckCircle, FileText } from 'lucide-react';
import { isChromeStorageAvailable } from '../../lib/runtime';
import type { ScoreLogEntry } from '../../types';

export function DashboardTab(): JSX.Element {
  const [history, setHistory] = useState<ScoreLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isChromeStorageAvailable()) {
      setIsLoading(false);
      return;
    }
    
    // Load initial history
    chrome.storage.local.get('scoreHistory', (result) => {
      setHistory((result.scoreHistory as ScoreLogEntry[] | undefined) || []);
      setIsLoading(false);
    });

    // Subscribe to storage changes
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

  if (isLoading) {
    return (
      <div className="dashboard-tab">
        <div className="empty-state">
          <div className="empty-state-icon">
            <BarChart3 size={48} strokeWidth={1.5} />
          </div>
          <p className="empty-state-description">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="dashboard-tab">
        <div className="empty-state">
          <div className="empty-state-icon">
            <BarChart3 size={48} strokeWidth={1.5} />
          </div>
          <h3 className="empty-state-title">No Data Yet</h3>
          <p className="empty-state-description">
            Enable "Save score history" in Settings and start posting to see your analytics.
          </p>
        </div>
      </div>
    );
  }

  // Separate posted and draft entries
  const postedEntries = history.filter(e => e.status === 'posted');
  const draftEntries = history.filter(e => e.status === 'draft');
  const totalDrafts = draftEntries.length;
  const totalPosted = postedEntries.length;

  // Get recent activity (last 3 items)
  const recentActivity = [...history]
    .sort((a, b) => (b.createdAt || b.timestamp) - (a.createdAt || a.timestamp))
    .slice(0, 3);

  // Calculate stats primarily from posted entries (or all if no posted entries yet)
  const statsHistory = postedEntries.length > 0 ? postedEntries : history;
  const totalTweets = statsHistory.length;
  const avgScore = totalTweets > 0 ? Math.round(statsHistory.reduce((sum, entry) => sum + entry.score, 0) / totalTweets) : 0;
  const bestScore = totalTweets > 0 ? Math.max(...statsHistory.map(e => e.score)) : 0;
  const gradeDistribution = calculateGradeDistribution(statsHistory);
  const recentTrend = calculateRecentTrend(statsHistory);
  const avgReach = calculateAvgReach(statsHistory);

  return (
    <div className="dashboard-tab">
      {/* Recent Activity Section */}
      {recentActivity.length > 0 && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ 
            fontSize: '0.875rem', 
            fontWeight: 600, 
            marginBottom: 'var(--space-3)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}>
            <Clock size={16} />
            Recent Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {recentActivity.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                {/* Status Icon */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: entry.status === 'posted' ? '#16a34a20' : '#ca8a0420',
                  color: entry.status === 'posted' ? '#16a34a' : '#ca8a04',
                  flexShrink: 0,
                }}>
                  {entry.status === 'posted' ? <CheckCircle size={18} /> : <FileText size={18} />}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-1)',
                  }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      padding: '2px 8px', 
                      borderRadius: '12px',
                      backgroundColor: entry.status === 'posted' ? '#16a34a20' : '#ca8a0420',
                      color: entry.status === 'posted' ? '#16a34a' : '#ca8a04',
                    }}>
                      {entry.status === 'posted' ? 'Posted' : 'Draft'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(entry.createdAt || entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {entry.tweetPreview && (
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      "{entry.tweetPreview}"
                    </div>
                  )}
                </div>

                {/* Score */}
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: getScoreColor(entry.score) }}>
                    {entry.score}
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: getScoreColor(entry.score) }}>
                    {entry.grade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Summary */}
      {(totalDrafts > 0 || totalPosted > 0) && (
        <div style={{ 
          marginBottom: 'var(--space-4)', 
          padding: 'var(--space-3)',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          gap: 'var(--space-4)',
          justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#16a34a' }}>{totalPosted}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Posted</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ca8a04' }}>{totalDrafts}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Drafts</div>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <BarChart3 size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalTweets}</div>
            <div className="stat-label">{postedEntries.length > 0 ? 'Posted Tweets' : 'Tweets Scored'}</div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <Target size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{avgScore}</div>
            <div className="stat-label">Avg Score</div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <Award size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{bestScore}</div>
            <div className="stat-label">Best Score</div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{recentTrend > 0 ? '+' : ''}{recentTrend}</div>
            <div className="stat-label">Recent Trend</div>
          </div>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">Grade Distribution</h3>
        <div className="grade-distribution">
          {Object.entries(gradeDistribution).map(([grade, count]) => {
            const percentage = (count / totalTweets) * 100;
            return (
              <div key={grade} className="grade-bar-container">
                <div className="grade-bar-label">
                  <span className="grade-letter">{grade}</span>
                  <span className="grade-count">{count}</span>
                </div>
                <div className="grade-bar-track">
                  <div
                    className="grade-bar-fill"
                    data-grade={grade}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="grade-bar-percent">{percentage.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Score Timeline */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">Score Timeline</h3>
        <div className="score-timeline">
          <ScoreSparkline scores={statsHistory.slice(-20).map(e => e.score)} />
        </div>
      </div>

      {/* Reach Insights */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">Predicted Reach</h3>
        <div className="reach-insight">
          <div className="reach-stat">
            <div className="reach-label">Average Low</div>
            <div className="reach-value">{avgReach.low.toLocaleString()}</div>
          </div>
          <div className="reach-stat">
            <div className="reach-label">Average High</div>
            <div className="reach-value">{avgReach.high.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Content Insights */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">Content Insights</h3>
        <ContentInsights history={statsHistory} />
      </div>
    </div>
  );
}

function calculateGradeDistribution(history: ScoreLogEntry[]): Record<string, number> {
  const distribution: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  history.forEach(entry => {
    if (entry.grade in distribution) {
      distribution[entry.grade]++;
    }
  });
  return distribution;
}

function calculateRecentTrend(history: ScoreLogEntry[]): number {
  if (history.length < 10) return 0;
  
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
  const recent = sorted.slice(-10);
  const older = sorted.slice(-20, -10);
  
  if (older.length === 0) return 0;
  
  const recentAvg = recent.reduce((sum, e) => sum + e.score, 0) / recent.length;
  const olderAvg = older.reduce((sum, e) => sum + e.score, 0) / older.length;
  
  return Math.round(recentAvg - olderAvg);
}

function calculateAvgReach(history: ScoreLogEntry[]): { low: number; high: number } {
  const avgLow = history.reduce((sum, e) => sum + e.predictedReach.low, 0) / history.length;
  const avgHigh = history.reduce((sum, e) => sum + e.predictedReach.high, 0) / history.length;
  return {
    low: Math.round(avgLow),
    high: Math.round(avgHigh),
  };
}

function ScoreSparkline({ scores }: { scores: number[] }): JSX.Element {
  if (scores.length === 0) return <div>No data</div>;
  
  const max = Math.max(...scores, 100);
  const min = Math.min(...scores, 0);
  const range = max - min || 1;
  
  const points = scores.map((score, index) => {
    const x = (index / (scores.length - 1)) * 100;
    const y = 100 - ((score - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ContentInsights({ history }: { history: ScoreLogEntry[] }): JSX.Element {
  const withMedia = history.filter(e => e.hasMedia).length;
  const withLinks = history.filter(e => e.externalLinks && e.externalLinks > 0).length;
  const threads = history.filter(e => e.isThread).length;
  const replies = history.filter(e => e.isReply).length;

  const insights = [
    { label: 'With Media', count: withMedia, percentage: (withMedia / history.length) * 100 },
    { label: 'With Links', count: withLinks, percentage: (withLinks / history.length) * 100 },
    { label: 'Threads', count: threads, percentage: (threads / history.length) * 100 },
    { label: 'Replies', count: replies, percentage: (replies / history.length) * 100 },
  ];

  return (
    <div className="content-insights">
      {insights.map(insight => (
        <div key={insight.label} className="insight-row">
          <span className="insight-label">{insight.label}</span>
          <span className="insight-value">
            {insight.count} ({insight.percentage.toFixed(0)}%)
          </span>
        </div>
      ))}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#ca8a04';
  if (score >= 40) return '#ea580c';
  return '#dc2626';
}
