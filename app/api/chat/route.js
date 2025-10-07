// app/api/chat/route.js

import { ai } from '../../../lib/aiClient'; // Import the AI client
import { supabase } from '../../../lib/supabaseClient'; // Import the database client

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
        const [historyResult, watchlistResult, reviewsResult] = await Promise.all([
            // Recent chat history
            supabase
                .from('chatbot_history')
                .select('role, content')
                .eq('user_id', userId)
                .order('timestamp', { ascending: true })
                .limit(10),
            
            // User's watchlist for preferences
            supabase
                .from('watchlist')
                .select('title, media_type, vote_average, overview')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(15),
            
            // User's reviews for taste analysis
            supabase
                .from('reviews')
                .select('rating, comment, movie_id')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10)
        ]);

        const { data: history, error: historyError } = historyResult;
        const { data: watchlist, error: watchlistError } = watchlistResult;
        const { data: reviews, error: reviewsError } = reviewsResult;

        if (historyError) throw historyError;

        // 3. Build user context for personalization
        let userContext = "";
        
        if (watchlist && watchlist.length > 0) {
            const movieCount = watchlist.filter(item => item.media_type === 'movie').length;
            const tvCount = watchlist.filter(item => item.media_type === 'tv').length;
            const avgRating = watchlist.reduce((sum, item) => sum + (item.vote_average || 0), 0) / watchlist.length;
            
            userContext += `User's Watchlist Context: They have ${movieCount} movies and ${tvCount} TV shows in their watchlist. `;
            userContext += `They tend to prefer content with an average rating of ${avgRating.toFixed(1)}/10. `;
            
            const recentTitles = watchlist.slice(0, 5).map(item => item.title).join(', ');
            userContext += `Recent additions: ${recentTitles}. `;
        }

        if (reviews && reviews.length > 0) {
            const avgUserRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
            const highRatedCount = reviews.filter(review => review.rating >= 8).length;
            
            userContext += `User's Review History: They give an average rating of ${avgUserRating.toFixed(1)}/10. `;
            userContext += `They've highly rated (8+) ${highRatedCount} out of ${reviews.length} reviewed movies. `;
            
            // Analyze sentiment from recent comments
            const recentComments = reviews.slice(0, 3).map(r => r.comment).filter(Boolean);
            if (recentComments.length > 0) {
                userContext += `Recent review themes: ${recentComments.join(' | ')}. `;
            }
        }

        // 4. Construct the conversation array for Gemini
        const conversation = history.map(h => ({
            role: h.role === 'model' ? 'model' : 'user', 
            parts: [{ text: h.content }]
        }));
        
        // Add the current message
        conversation.push({ role: 'user', parts: [{ text: message }] });

        // 5. Enhanced AI instruction with personalization
        const systemPrompt = `You are BingiBot, a highly personalized movie and TV show recommender. 

PERSONALIZATION CONTEXT: ${userContext}

CORE INSTRUCTIONS:
- Use the user's watchlist and review history to make personalized recommendations
- Reference their preferences when suggesting content
- If they like high-rated content, suggest critically acclaimed options
- If they have diverse tastes, mention that and suggest variety
- For mood-based requests, consider their past preferences
- Always provide specific movie/TV show titles with brief, engaging descriptions
- Include why this recommendation fits their taste profile
- If they ask non-entertainment questions, politely redirect to movies/TV shows
- Keep responses conversational, friendly, and under 150 words
- Always mention the year and genre for clarity

RESPONSE FORMAT:
- Start with a personalized greeting referencing their preferences if relevant
- Provide 1-2 specific recommendations with titles, years, and brief descriptions
- Explain why these fit their taste based on their history
- End with an engaging question to continue the conversation`;

        // 6. Call the Gemini API
        const genAI = ai;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const chat = model.startChat({
            history: conversation.slice(0, -1), // All except the current message
            generationConfig: {
                maxOutputTokens: 300,
                temperature: 0.7,
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