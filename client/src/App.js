import React, { useState, useEffect, useCallback } from 'react';
import ReviewForm from './components/ReviewForm';
import ReviewList from './components/ReviewList';
import ReviewDetail from './components/ReviewDetail';
import './App.css';

const API_BASE = '/api/reviews';

export default function App() {
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      setError('Failed to fetch reviews');
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Poll for in-progress reviews
  useEffect(() => {
    const hasInProgress = reviews.some(
      (r) => r.status === 'pending' || r.status === 'in_progress'
    );
    if (!hasInProgress) return;

    const interval = setInterval(fetchReviews, 5000);
    return () => clearInterval(interval);
  }, [reviews, fetchReviews]);

  const submitReview = async (url) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit review');
      }
      await fetchReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewReview = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      const data = await res.json();
      setSelectedReview(data);
    } catch (err) {
      setError('Failed to load review details');
    }
  };

  const deleteReview = async (id) => {
    try {
      await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      setSelectedReview(null);
      await fetchReviews();
    } catch (err) {
      setError('Failed to delete review');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>SL-360 QA</h1>
        <p className="subtitle">eLearning Review Platform</p>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {selectedReview ? (
          <ReviewDetail
            review={selectedReview}
            onBack={() => setSelectedReview(null)}
            onDelete={deleteReview}
          />
        ) : (
          <>
            <ReviewForm onSubmit={submitReview} loading={loading} />
            <ReviewList reviews={reviews} onSelect={viewReview} />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>SL-360 QA Platform &mdash; Grammar, Design &amp; Functionality Review</p>
      </footer>
    </div>
  );
}
