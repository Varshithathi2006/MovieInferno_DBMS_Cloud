"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button"; 
// Assuming a TextArea component exists for the comment field
// Assuming a Rating component exists for star selection

interface ReviewFormProps {
    movieId: number;
    movieTitle: string; // For feedback purposes
    onReviewSuccess: () => void; // Function to refresh movie details after submission
}

export function ReviewForm({ movieId, movieTitle, onReviewSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(0); // 1-10 scale
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rating || !comment.trim()) {
            alert("Please provide a rating and a comment.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    movieId: movieId, 
                    rating: rating,
                    comment: comment 
                }),
            });

            if (!response.ok) throw new Error("Server failed to post review.");

            alert(`✅ Review for "${movieTitle}" submitted!`);
            setRating(0);
            setComment('');
            onReviewSuccess(); // Refresh the movie page's data

        } catch (error) {
            console.error("Submission Error:", error);
            alert("❌ Submission failed. Check your network.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-gray-900 rounded-lg space-y-4">
            <h3 className="text-xl font-bold text-white">Post Your Review</h3>
            
            {/* Rating Input (Placeholder for your star component) */}
            <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-400">Rating (1-10):</label>
                <input 
                    type="number" 
                    min="1" max="10" 
                    value={rating} 
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-16 p-2 rounded bg-gray-800 border border-gray-700 text-white"
                />
            </div>
            
            {/* Comment Area (Placeholder for your TextArea component) */}
            <textarea
                placeholder="Write your review here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white resize-none"
            />
            
            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
                {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
        </form>
    );
}