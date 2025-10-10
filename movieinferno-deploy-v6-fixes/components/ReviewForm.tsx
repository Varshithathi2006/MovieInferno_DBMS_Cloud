"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"; 
import { supabase } from '@/lib/supabaseClient';

interface ReviewFormProps {
    movieId: number;
    movieTitle: string; // For feedback purposes
    onReviewSuccess: () => void; // Function to refresh movie details after submission
}

export function ReviewForm({ movieId, movieTitle, onReviewSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(0); // 1-10 scale
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState<string>('');

    // Check authentication
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        };
        checkAuth();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!user) {
            setError("Please log in to submit a review.");
            return;
        }

        if (!rating || !comment.trim()) {
            setError("Please provide a rating and a comment.");
            return;
        }

        if (rating < 1 || rating > 10) {
            setError("Rating must be between 1 and 10.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_id: user.id,
                    movie_id: movieId, 
                    rating: rating,
                    comment: comment 
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    setError("You have already reviewed this movie.");
                } else {
                    setError(result.error || "Failed to submit review.");
                }
                return;
            }

            alert(`✅ Review for "${movieTitle}" submitted!`);
            setRating(0);
            setComment('');
            onReviewSuccess(); // Refresh the movie page's data

        } catch (error) {
            console.error("Submission Error:", error);
            setError("❌ Submission failed. Check your network.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="p-6 bg-gray-900 rounded-lg space-y-4">
                <h3 className="text-xl font-bold text-white">Post Your Review</h3>
                <p className="text-gray-400">Please log in to submit a review.</p>
                <Button 
                    onClick={() => window.location.href = '/login'} 
                    className="bg-red-600 hover:bg-red-700"
                >
                    Log In
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-gray-900 rounded-lg space-y-4">
            <h3 className="text-xl font-bold text-white">Post Your Review</h3>
            
            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
                    {error}
                </div>
            )}
            
            {/* Rating Input */}
            <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-400">Rating (1-10):</label>
                <input 
                    type="number" 
                    min="1" max="10" 
                    value={rating} 
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-16 p-2 rounded bg-gray-800 border border-gray-700 text-white"
                    disabled={loading}
                />
            </div>
            
            {/* Comment Area */}
            <textarea
                placeholder="Write your review here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white resize-none"
                disabled={loading}
            />
            
            <Button 
                type="submit" 
                disabled={loading || !rating || !comment.trim()} 
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
                {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
        </form>
    );
}