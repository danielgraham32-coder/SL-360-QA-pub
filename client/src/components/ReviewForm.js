import React, { useState } from 'react';

export default function ReviewForm({ onSubmit, loading }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit(url.trim());
    setUrl('');
  };

  return (
    <div className="review-form">
      <h2>Review an eLearning Course</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16, fontSize: 14 }}>
        Paste a link to your published Storyline 360 or HTML eLearning course. The platform will
        navigate through it like a learner and check for grammar, design, and functionality issues.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/training/story.html"
            required
          />
          <button type="submit" className="btn-primary" disabled={loading || !url.trim()}>
            {loading ? 'Submitting...' : 'Start Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
