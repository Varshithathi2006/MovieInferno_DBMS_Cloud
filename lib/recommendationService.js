// lib/recommendationService.js
// Advanced recommendation service for personalized movie and TV suggestions

import { supabase } from './supabaseClient';

// Genre mapping for TMDB
const GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

// Mood to genre mapping
const MOOD_GENRES = {
    happy: [35, 12, 16, 10751], // Comedy, Adventure, Animation, Family
    sad: [18, 10749, 36], // Drama, Romance, History
    stressed: [35, 16, 10751], // Comedy, Animation, Family
    bored: [28, 53, 878, 9648], // Action, Thriller, Sci-Fi, Mystery
    romantic: [10749, 35, 18], // Romance, Comedy, Drama
    adventurous: [12, 28, 14, 878], // Adventure, Action, Fantasy, Sci-Fi
    nostalgic: [36, 18, 10402], // History, Drama, Music
    thoughtful: [18, 99, 878, 9648] // Drama, Documentary, Sci-Fi, Mystery
};

export class RecommendationService {
    constructor() {
        this.apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        this.baseUrl = 'https://api.themoviedb.org/3';
    }

    // Get user's preference profile
    async getUserProfile(userId) {
        try {
            const [watchlistResult, reviewsResult] = await Promise.all([
                supabase
                    .from('watchlist')
                    .select('title, media_type, vote_average, genre_ids, release_date, first_air_date')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(50),
                
                supabase
                    .from('reviews')
                    .select('rating, comment, movie_id, created_at')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(30)
            ]);

            const { data: watchlist } = watchlistResult;
            const { data: reviews } = reviewsResult;

            return this.analyzeUserPreferences(watchlist || [], reviews || []);
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    // Analyze user preferences from their data
    analyzeUserPreferences(watchlist, reviews) {
        const profile = {
            favoriteGenres: [],
            preferredRating: 7.0,
            contentEra: 'mixed', // modern, classic, mixed
            ratingStyle: 'balanced', // generous, critical, balanced
            mediaTypePreference: 'mixed', // movie, tv, mixed
            diversityScore: 0 // 0-1, how diverse their tastes are
        };

        if (watchlist.length === 0 && reviews.length === 0) {
            return profile;
        }

        // Analyze genre preferences
        const genreCounts = {};
        watchlist.forEach(item => {
            if (item.genre_ids) {
                item.genre_ids.forEach(genreId => {
                    genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
                });
            }
        });

        profile.favoriteGenres = Object.entries(genreCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([genreId]) => parseInt(genreId));

        // Analyze preferred rating
        if (watchlist.length > 0) {
            const avgRating = watchlist.reduce((sum, item) => sum + (item.vote_average || 7), 0) / watchlist.length;
            profile.preferredRating = avgRating;
        }

        // Analyze content era preference
        const recentCount = watchlist.filter(item => {
            const year = new Date(item.release_date || item.first_air_date || '2000').getFullYear();
            return year >= 2015;
        }).length;
        
        const classicCount = watchlist.filter(item => {
            const year = new Date(item.release_date || item.first_air_date || '2000').getFullYear();
            return year < 2000;
        }).length;

        if (recentCount > classicCount * 2) profile.contentEra = 'modern';
        else if (classicCount > recentCount * 2) profile.contentEra = 'classic';
        else profile.contentEra = 'mixed';

        // Analyze rating style from reviews
        if (reviews.length > 0) {
            const avgUserRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
            if (avgUserRating >= 7.5) profile.ratingStyle = 'generous';
            else if (avgUserRating <= 6) profile.ratingStyle = 'critical';
            else profile.ratingStyle = 'balanced';
        }

        // Analyze media type preference
        const movieCount = watchlist.filter(item => item.media_type === 'movie').length;
        const tvCount = watchlist.filter(item => item.media_type === 'tv').length;
        
        if (movieCount > tvCount * 2) profile.mediaTypePreference = 'movie';
        else if (tvCount > movieCount * 2) profile.mediaTypePreference = 'tv';
        else profile.mediaTypePreference = 'mixed';

        // Calculate diversity score
        const uniqueGenres = Object.keys(genreCounts).length;
        profile.diversityScore = Math.min(uniqueGenres / 10, 1); // Normalize to 0-1

        return profile;
    }

    // Get mood-based recommendations
    async getMoodRecommendations(mood, userProfile, count = 3) {
        const moodGenres = MOOD_GENRES[mood.toLowerCase()] || MOOD_GENRES.bored;
        
        // Blend mood genres with user preferences
        let targetGenres = moodGenres;
        if (userProfile && userProfile.favoriteGenres.length > 0) {
            // Mix 70% mood genres, 30% user preferences
            targetGenres = [
                ...moodGenres,
                ...userProfile.favoriteGenres.slice(0, 2)
            ];
        }

        return this.getRecommendationsByGenres(targetGenres, userProfile, count);
    }

    // Get recommendations by genres
    async getRecommendationsByGenres(genreIds, userProfile, count = 3) {
        try {
            const recommendations = [];
            const genreString = genreIds.join(',');
            
            // Determine year range based on user preference
            let yearRange = '';
            if (userProfile) {
                const currentYear = new Date().getFullYear();
                if (userProfile.contentEra === 'modern') {
                    yearRange = `&primary_release_date.gte=${currentYear - 5}-01-01`;
                } else if (userProfile.contentEra === 'classic') {
                    yearRange = `&primary_release_date.lte=1999-12-31`;
                }
            }

            // Get movie recommendations
            if (!userProfile || userProfile.mediaTypePreference !== 'tv') {
                const movieUrl = `${this.baseUrl}/discover/movie?api_key=${this.apiKey}&with_genres=${genreString}&sort_by=vote_average.desc&vote_count.gte=100${yearRange}&page=1`;
                const movieResponse = await fetch(movieUrl);
                const movieData = await movieResponse.json();
                
                if (movieData.results) {
                    recommendations.push(...movieData.results.slice(0, Math.ceil(count / 2)).map(movie => ({
                        ...movie,
                        media_type: 'movie',
                        title: movie.title,
                        release_year: movie.release_date ? new Date(movie.release_date).getFullYear() : null
                    })));
                }
            }

            // Get TV recommendations
            if (!userProfile || userProfile.mediaTypePreference !== 'movie') {
                const tvUrl = `${this.baseUrl}/discover/tv?api_key=${this.apiKey}&with_genres=${genreString}&sort_by=vote_average.desc&vote_count.gte=50&page=1`;
                const tvResponse = await fetch(tvUrl);
                const tvData = await tvResponse.json();
                
                if (tvData.results) {
                    recommendations.push(...tvData.results.slice(0, Math.floor(count / 2)).map(show => ({
                        ...show,
                        media_type: 'tv',
                        title: show.name,
                        release_year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null
                    })));
                }
            }

            // Filter by user's preferred rating if available
            let filteredRecommendations = recommendations;
            if (userProfile && userProfile.preferredRating) {
                const minRating = userProfile.ratingStyle === 'critical' ? userProfile.preferredRating - 1 : userProfile.preferredRating - 0.5;
                filteredRecommendations = recommendations.filter(item => item.vote_average >= minRating);
            }

            // Return top recommendations
            return filteredRecommendations
                .sort((a, b) => b.vote_average - a.vote_average)
                .slice(0, count);

        } catch (error) {
            console.error('Error getting recommendations:', error);
            return [];
        }
    }

    // Get similar content based on user's watchlist
    async getSimilarRecommendations(userProfile, count = 3) {
        if (!userProfile || userProfile.favoriteGenres.length === 0) {
            return this.getTrendingRecommendations(count);
        }

        return this.getRecommendationsByGenres(userProfile.favoriteGenres, userProfile, count);
    }

    // Get trending recommendations as fallback
    async getTrendingRecommendations(count = 3) {
        try {
            const [movieResponse, tvResponse] = await Promise.all([
                fetch(`${this.baseUrl}/trending/movie/week?api_key=${this.apiKey}`),
                fetch(`${this.baseUrl}/trending/tv/week?api_key=${this.apiKey}`)
            ]);

            const movieData = await movieResponse.json();
            const tvData = await tvResponse.json();

            const recommendations = [
                ...movieData.results.slice(0, Math.ceil(count / 2)).map(movie => ({
                    ...movie,
                    media_type: 'movie',
                    title: movie.title,
                    release_year: movie.release_date ? new Date(movie.release_date).getFullYear() : null
                })),
                ...tvData.results.slice(0, Math.floor(count / 2)).map(show => ({
                    ...show,
                    media_type: 'tv',
                    title: show.name,
                    release_year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null
                }))
            ];

            return recommendations.slice(0, count);
        } catch (error) {
            console.error('Error getting trending recommendations:', error);
            return [];
        }
    }

    // Format recommendations for chatbot response
    formatRecommendationsForChat(recommendations, context = '') {
        if (!recommendations || recommendations.length === 0) {
            return "I couldn't find any specific recommendations right now, but I'd love to help you discover something great! Tell me more about what you're in the mood for.";
        }

        let response = context ? `${context}\n\n` : '';
        response += "Here are my personalized recommendations for you:\n\n";

        recommendations.forEach((item, index) => {
            const genres = item.genre_ids ? 
                item.genre_ids.slice(0, 2).map(id => GENRE_MAP[id]).filter(Boolean).join(', ') : 
                'Various genres';
            
            response += `• **${item.title}** (${item.release_year || 'N/A'}) - ${genres}\n`;
            response += `  ${item.overview ? item.overview.substring(0, 120) + '...' : 'A great choice for your viewing pleasure!'}\n`;
            response += `  ⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10\n\n`;
        });

        return response.trim();
    }
}

// Export singleton instance
export const recommendationService = new RecommendationService();