import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { isChromeStorageAvailable } from '../../lib/runtime';
import type { ScoreLogEntry } from '../../types';

export function HistoryPreview(): JSX.Element {
  const [history, setHistory] = useState<ScoreLogEntry[]>([]);

  useEffect(() => {
    if (!isChromeStorageAvailable()) return;
    
    // Load initial history
    chrome.storage.local.get('scoreHistory', (result) => {
      setHistory((result.scoreHistory as ScoreLogEntry[] | undefined) || []);
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

  if (history.length === 0) return <></>;

  const recentScores = history.slice(-5).reverse();

  return (
    <div className="history-preview">
      <div className="history-header">
        <BarChart3 size={16} strokeWidth={1.5} />
        <span>Recent Scores</span>
      </div>

      <div className="history-list">
        {recentScores.map((entry, index) => (
          <div key={index} className="history-item">
            <div className="history-score">{entry.score}</div>
            <div className="history-details">
              <div className="history-date">
                {new Date(entry.timestamp).toLocaleDateString()}
              </div>
              <div className="history-reach">
                {entry.predictedReach.low.toLocaleString()} - {entry.predictedReach.high.toLocaleString()} impressions
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
