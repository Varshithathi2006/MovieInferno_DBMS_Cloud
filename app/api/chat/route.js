// app/api/chat/route.js

import { ai } from '../../../lib/aiClient'; // Import the AI client
import { supabase } from '@/lib/supabaseClient'; // Import the database client
import { recommendationService } from '../../../lib/recommendationService'; // Import recommendation service

export async function POST(request) {
    try {
        const { userId, message } = await request.json();

        // 1. Store the user's message immediately (Memory)
        await supabase.from('chatbot_history').insert({
            user_id: userId,
            role: 'user',
            content: message,
        });

        // 2. Fetch user's personalization data for context
        const [historyResult, watchlistResult, reviewsResult, userProfileResult] = await Promise.all([
            // Recent chat history
            supabase
                .from('chatbot_history')
                .select('role, content')
                .eq('user_id', userId)
                .order('timestamp', { ascending: true })
                .limit(15),
            
            // User's watchlist for preferences with genre info
            supabase
                .from('watchlist')
                .select('title, media_type, vote_average, overview, genre_ids, release_date, first_air_date')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20),
            
            // User's reviews for taste analysis with movie details
            supabase
                .from('reviews')
                .select('rating, comment, movie_id, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(15),
            
            // User profile for additional context
            supabase
                .from('users')
                .select('email, created_at')
                .eq('id', userId)
                .single()
        ]);

        const { data: history, error: historyError } = historyResult;
        const { data: watchlist, error: watchlistError } = watchlistResult;
        const { data: reviews, error: reviewsError } = reviewsResult;
        const { data: userProfile, error: userProfileError } = userProfileResult;

        if (historyError) throw historyError;

        // Genre mapping for better context
        const genreMap = {
            28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
            99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
            27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
            10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
        };

        // 3. Build enhanced user context for personalization
        let userContext = "";
        
        // User tenure and engagement
        if (userProfile) {
            const accountAge = Math.floor((new Date() - new Date(userProfile.created_at)) / (1000 * 60 * 60 * 24));
            userContext += `User Profile: Account created ${accountAge} days ago. `;
        }

        if (watchlist && watchlist.length > 0) {
            const movieCount = watchlist.filter(item => item.media_type === 'movie').length;
            const tvCount = watchlist.filter(item => item.media_type === 'tv').length;
            const avgRating = watchlist.reduce((sum, item) => sum + (item.vote_average || 0), 0) / watchlist.length;
            
            // Analyze favorite genres
            const allGenres = watchlist.flatMap(item => item.genre_ids || []);
            const genreCounts = {};
            allGenres.forEach(genreId => {
                genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
            });
            const topGenres = Object.entries(genreCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([genreId]) => genreMap[genreId] || 'Unknown')
                .filter(Boolean);

            // Analyze content preferences by era
            const recentContent = watchlist.filter(item => {
                const year = new Date(item.release_date || item.first_air_date || '2000').getFullYear();
                return year >= 2020;
            }).length;
            const classicContent = watchlist.filter(item => {
                const year = new Date(item.release_date || item.first_air_date || '2000').getFullYear();
                return year < 2000;
            }).length;

            userContext += `Watchlist Analysis: ${movieCount} movies, ${tvCount} TV shows (${watchlist.length} total). `;
            userContext += `Prefers content rated ${avgRating.toFixed(1)}/10 on average. `;
            if (topGenres.length > 0) {
                userContext += `Favorite genres: ${topGenres.join(', ')}. `;
            }
            if (recentContent > classicContent) {
                userContext += `Prefers modern content (2020+). `;
            } else if (classicContent > recentContent) {
                userContext += `Enjoys classic films and shows. `;
            }
            
            const recentTitles = watchlist.slice(0, 4).map(item => item.title).join(', ');
            userContext += `Recent additions: ${recentTitles}. `;
        }

        if (reviews && reviews.length > 0) {
            const avgUserRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
            const highRatedCount = reviews.filter(review => review.rating >= 8).length;
            const lowRatedCount = reviews.filter(review => review.rating <= 5).length;
            
            // Determine user's rating style
            let ratingStyle = "balanced";
            if (avgUserRating >= 7.5) ratingStyle = "generous";
            else if (avgUserRating <= 6) ratingStyle = "critical";

            userContext += `Review History: ${reviews.length} reviews, average ${avgUserRating.toFixed(1)}/10 (${ratingStyle} reviewer). `;
            userContext += `Highly rated: ${highRatedCount}, poorly rated: ${lowRatedCount}. `;
            
            // Analyze sentiment from recent comments
            const recentComments = reviews.slice(0, 3).map(r => r.comment).filter(Boolean);
            if (recentComments.length > 0) {
                const positiveWords = ['amazing', 'excellent', 'fantastic', 'brilliant', 'outstanding', 'perfect', 'love', 'great'];
                const negativeWords = ['terrible', 'awful', 'boring', 'disappointing', 'waste', 'bad', 'worst', 'hate'];
                
                const sentiment = recentComments.join(' ').toLowerCase();
                const positiveCount = positiveWords.filter(word => sentiment.includes(word)).length;
                const negativeCount = negativeWords.filter(word => sentiment.includes(word)).length;
                
                if (positiveCount > negativeCount) {
                    userContext += `Recent reviews show positive sentiment. `;
                } else if (negativeCount > positiveCount) {
                    userContext += `Recent reviews show critical perspective. `;
                }
            }
        }

        // Chat history analysis for conversation style
        if (history && history.length > 0) {
            const userMessages = history.filter(h => h.role === 'user');
            const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;
            
            if (avgMessageLength > 100) {
                userContext += `Communication style: Detailed, thoughtful messages. `;
            } else if (avgMessageLength < 30) {
                userContext += `Communication style: Brief, direct messages. `;
            }
        }

        // Get user profile for recommendations
        const userRecommendationProfile = await recommendationService.getUserProfile(userId);
        
        // Detect if user is asking for recommendations and provide specific suggestions
        let specificRecommendations = '';
        const messageText = message.toLowerCase();
        
        if (messageText.includes('recommend') || messageText.includes('suggest') || 
            messageText.includes('what should i watch') || messageText.includes('mood')) {
            
            let recommendations = [];
            
            // Mood-based recommendations
            if (messageText.includes('happy') || messageText.includes('uplifting') || messageText.includes('fun')) {
                recommendations = await recommendationService.getMoodRecommendations('happy', userRecommendationProfile, 3);
            } else if (messageText.includes('sad') || messageText.includes('emotional') || messageText.includes('cry')) {
                recommendations = await recommendationService.getMoodRecommendations('sad', userRecommendationProfile, 3);
            } else if (messageText.includes('stressed') || messageText.includes('relax') || messageText.includes('calm')) {
                recommendations = await recommendationService.getMoodRecommendations('stressed', userRecommendationProfile, 3);
            } else if (messageText.includes('bored') || messageText.includes('exciting') || messageText.includes('action')) {
                recommendations = await recommendationService.getMoodRecommendations('bored', userRecommendationProfile, 3);
            } else if (messageText.includes('romantic') || messageText.includes('love') || messageText.includes('date')) {
                recommendations = await recommendationService.getMoodRecommendations('romantic', userRecommendationProfile, 3);
            } else if (messageText.includes('adventure') || messageText.includes('epic')) {
                recommendations = await recommendationService.getMoodRecommendations('adventurous', userRecommendationProfile, 3);
            } else if (messageText.includes('nostalgic') || messageText.includes('classic') || messageText.includes('old')) {
                recommendations = await recommendationService.getMoodRecommendations('nostalgic', userRecommendationProfile, 3);
            } else if (messageText.includes('thoughtful') || messageText.includes('deep') || messageText.includes('meaningful')) {
                recommendations = await recommendationService.getMoodRecommendations('thoughtful', userRecommendationProfile, 3);
            } else {
                // General recommendations based on user profile
                recommendations = await recommendationService.getSimilarRecommendations(userRecommendationProfile, 3);
            }
            
            if (recommendations && recommendations.length > 0) {
                specificRecommendations = recommendationService.formatRecommendationsForChat(recommendations);
            }
        }

        // 4. Construct the conversation array for Gemini
        const conversation = history.map(h => ({
            role: h.role === 'model' ? 'model' : 'user', 
            parts: [{ text: h.content }]
        }));
        
        // Add the current message
        conversation.push({ role: 'user', parts: [{ text: message }] });

        // 5. Enhanced AI instruction with sophisticated personalization
        const systemPrompt = `You are BingiBot, an AI movie and TV companion with deep personalization capabilities and a warm, engaging personality.

PERSONALIZATION CONTEXT: ${userContext}

${specificRecommendations ? `SPECIFIC RECOMMENDATIONS FOR THIS REQUEST:\n${specificRecommendations}\n\n` : ''}

CORE PERSONALITY:
- Enthusiastic cinephile who genuinely loves sharing great content 🎬
- Knowledgeable but approachable - like a friend who's seen everything
- Adapts communication style to match user preferences (casual vs detailed)
- Remembers and celebrates user's viewing journey and discoveries
- Provides thoughtful, tailored recommendations with personal touches
- Uses emojis and engaging language to create a friendly atmosphere
- Shows genuine excitement about great matches and hidden gems

CONVERSATIONAL STYLE:
- Start responses with acknowledgment of their request or mood
- Use "I think you'd love..." or "Based on your taste for..." to personalize
- Include brief, compelling "why" explanations for each recommendation
- Add context like "Since you enjoyed [previous title]..." when relevant
- End with engaging questions or conversation starters
- Use varied sentence structure to avoid repetitive patterns
- Include occasional movie trivia or behind-the-scenes insights
- Express genuine enthusiasm: "This is perfect for you!" or "You're in for a treat!"

RECOMMENDATION STRATEGY:
- When specific recommendations are provided above, weave them naturally into conversation
- Explain WHY each recommendation fits their taste profile and current mood
- Add personal insights about the recommended content (director, themes, style)
- Consider their rating patterns (generous/critical/balanced) and adjust tone
- Match content era preferences (modern vs classic) and explain connections
- Factor in their review sentiment and communication style
- Balance popular hits with hidden gems for discovery
- Reference their watchlist strategically: "I see you have X saved - this pairs perfectly!"

RESPONSE GUIDELINES:
- If specific recommendations are provided, use them as the foundation but add personality
- Reference specific titles from their watchlist/reviews to show you're paying attention
- Use their favorite genres as launching points for broader recommendations
- Adapt response length: concise for casual users, detailed for film enthusiasts
- Include release years in parentheses and brief, enticing descriptions
- Use **bold** for titles to make them stand out visually
- Create bullet points for multiple recommendations with engaging descriptions
- Always complete thoughts and provide satisfying conclusions
- Be conversational and explain your reasoning in an engaging way
- Add relevant emojis to enhance the visual appeal and personality

MOOD-BASED RECOMMENDATIONS WITH PERSONALITY:
- Happy/Upbeat: "Let's keep those good vibes going!" - Light comedies, feel-good adventures
- Sad/Emotional: "Sometimes we need a good cry or comfort watch" - Cathartic dramas, healing stories
- Stressed/Anxious: "Time to unwind with something soothing" - Calming content, familiar favorites
- Bored: "Let's find something that'll grab you from minute one!" - Engaging thrillers, binge-worthy series
- Romantic: "In the mood for love? I've got you covered!" - Love stories matching their preferences
- Adventurous: "Ready for an epic journey?" - Action, sci-fi, fantasy based on their taste profile
- Nostalgic: "Let's take a trip down memory lane" - Classic films, beloved franchises

ENGAGEMENT TECHNIQUES:
- Ask follow-up questions about their preferences or current mood
- Suggest related content: "If you like this, you might also enjoy..."
- Create anticipation: "Trust me on this one..." or "This might surprise you..."
- Acknowledge their expertise: "As someone who appreciates [genre]..."
- Celebrate their taste: "You have excellent taste in [specific area]!"
- Offer viewing tips: "Perfect for a weekend binge" or "Great for a cozy night in"

Always maintain warmth, genuine enthusiasm, and personal connection while being incredibly helpful and insightful.`;

        // 6. Call the Gemini API
        const genAI = ai;
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const chat = model.startChat({
            history: conversation.slice(0, -1), // All except the current message
            generationConfig: {
                maxOutputTokens: 800, // Increased from 300 to allow complete responses
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                stopSequences: ["\n\n\n"], // Stop at triple line breaks to prevent rambling
            },
        });

        const result = await chat.sendMessage(message);
        const botResponse = result.response.text();

        // 7. Store the AI's response (Update Memory)
        await supabase.from('chatbot_history').insert({
            user_id: userId,
            role: 'model',
            content: botResponse,
        });

        // 8. Return the final text to the frontend
        return new Response(JSON.stringify({ text: botResponse }), { status: 200 });

    } catch (error) {
        console.error("Chatbot API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}