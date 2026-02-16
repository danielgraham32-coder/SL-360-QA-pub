import React, { useState } from 'react';

const CATEGORIES = ['all', 'grammar', 'design', 'functionality'];
const SEVERITIES = ['all', 'critical', 'warning', 'info'];

export default function ReviewDetail({ review, onBack, onDelete }) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const summary = review.summary ? JSON.parse(review.summary) : null;
  const findings = review.findings || [];

  const filtered = findings.filter((f) => {
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="review-detail">
      <div className="detail-header">
        <div>
          <h2>Review Results</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 4 }}>
            {review.url}
          </p>
          <span className={`status-badge status-${review.status}`} style={{ marginTop: 8, display: 'inline-block' }}>
            {review.status === 'in_progress' ? 'In Progress' : review.status}
          </span>
        </div>
        <div className="detail-actions">
          <button className="btn-secondary" onClick={onBack}>Back</button>
          <button className="btn-danger" onClick={() => onDelete(review.id)}>Delete</button>
        </div>
      </div>

      {review.status === 'in_progress' || review.status === 'pending' ? (
        <div className="empty-state">
          <h3>Review In Progress</h3>
          <p>The platform is navigating through your course and analyzing content. This page will update automatically.</p>
        </div>
      ) : review.status === 'failed' ? (
        <div className="empty-state">
          <h3>Review Failed</h3>
          <p>{review.summary || 'An error occurred while reviewing the course.'}</p>
        </div>
      ) : (
        <>
          {summary && (
            <div className="summary-grid">
              <div className="summary-card">
                <div className="number">{summary.slidesReviewed}</div>
                <div className="label">Slides Reviewed</div>
              </div>
              <div className="summary-card">
                <div className="number">{summary.totalFindings}</div>
                <div className="label">Total Findings</div>
              </div>
              <div className="summary-card critical">
                <div className="number">{summary.bySeverity?.critical || 0}</div>
                <div className="label">Critical</div>
              </div>
              <div className="summary-card warning">
                <div className="number">{summary.bySeverity?.warning || 0}</div>
                <div className="label">Warnings</div>
              </div>
              <div className="summary-card info">
                <div className="number">{summary.bySeverity?.info || 0}</div>
                <div className="label">Info</div>
              </div>
            </div>
          )}

          {summary && (
            <div className="summary-grid" style={{ marginBottom: 24 }}>
              <div className="summary-card">
                <div className="number" style={{ fontSize: 24 }}>{summary.byCategory?.grammar || 0}</div>
                <div className="label">Grammar</div>
              </div>
              <div className="summary-card">
                <div className="number" style={{ fontSize: 24 }}>{summary.byCategory?.design || 0}</div>
                <div className="label">Design</div>
              </div>
              <div className="summary-card">
                <div className="number" style={{ fontSize: 24 }}>{summary.byCategory?.functionality || 0}</div>
                <div className="label">Functionality</div>
              </div>
            </div>
          )}

          <h3 style={{ marginBottom: 12 }}>Findings ({filtered.length})</h3>

          <div className="filter-bar">
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', alignSelf: 'center' }}>Category:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div className="filter-bar" style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', alignSelf: 'center' }}>Severity:</span>
            {SEVERITIES.map((sev) => (
              <button
                key={sev}
                className={`filter-btn ${severityFilter === sev ? 'active' : ''}`}
                onClick={() => setSeverityFilter(sev)}
              >
                {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>No findings match the selected filters.</p>
            </div>
          ) : (
            filtered.map((finding, i) => (
              <div key={finding.id || i} className={`finding-card ${finding.severity}`}>
                <div className="finding-header">
                  <span className="finding-category">{finding.category}</span>
                  <span className="finding-slide">
                    Slide {finding.slide_number}
                    {finding.slide_title ? ` — ${finding.slide_title}` : ''}
                  </span>
                </div>
                <div className="finding-description">{finding.description}</div>
                {finding.suggestion && (
                  <div className="finding-suggestion">
                    <strong>Suggestion:</strong> {finding.suggestion}
                  </div>
                )}
                {finding.raw_text && (
                  <div className="finding-raw">{finding.raw_text}</div>
                )}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
