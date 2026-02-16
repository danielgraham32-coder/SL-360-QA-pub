import React from 'react';

export default function ReviewList({ reviews, onSelect }) {
  if (reviews.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Reviews Yet</h3>
        <p>Submit a course URL above to start your first review.</p>
      </div>
    );
  }

  return (
    <div className="review-list">
      <h2>Reviews</h2>
      {reviews.map((review) => (
        <div
          key={review.id}
          className="review-card"
          onClick={() => onSelect(review.id)}
        >
          <div className="review-card-info">
            <div className="review-card-url">{review.url}</div>
            <div className="review-card-date">
              {new Date(review.created_at).toLocaleString()}
            </div>
          </div>
          <span className={`status-badge status-${review.status}`}>
            {review.status === 'in_progress' ? 'In Progress' : review.status}
          </span>
        </div>
      ))}
    </div>
  );
}
