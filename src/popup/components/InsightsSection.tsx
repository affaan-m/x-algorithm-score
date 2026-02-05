import { MessageCircle, Video, Link, HelpCircle, Zap, Users, Filter, ExternalLink } from 'lucide-react';
import { getAllInsights } from '../../lib/insights';

const iconMap = {
  'message-circle': MessageCircle,
  'video': Video,
  'link': Link,
  'help-circle': HelpCircle,
  'zap': Zap,
  'users': Users,
  'filter': Filter,
};

export function InsightsSection(): JSX.Element {
  const insights = getAllInsights();

  return (
    <div className="insights-section">
      <div className="insights-header">
        <h3>Algorithm Insights</h3>
        <p>Based on <a href="https://github.com/xai-org/x-algorithm" target="_blank" rel="noopener noreferrer" style={{color: 'var(--accent)', textDecoration: 'underline'}}>xai-org/x-algorithm</a> + community research</p>
      </div>

      <div className="insights-grid">
        {insights.map((insight) => {
          const IconComponent = iconMap[insight.icon];
          return (
            <div key={insight.id} className="insight-card" data-type={insight.type}>
              <div className="insight-icon">
                <IconComponent size={20} strokeWidth={1.5} />
              </div>
              <div className="insight-content">
                <div className="insight-title">
                  {insight.title}
                  {insight.type === 'verified' && (
                    <span className="verified-badge" title="Verified from open-source code">✓</span>
                  )}
                </div>
                <div className="insight-description">{insight.description}</div>
                {insight.source && (
                  <div className="insight-source">
                    <a href={insight.source.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={12} style={{marginRight: '4px', display: 'inline'}} />
                      {insight.source.name}
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
