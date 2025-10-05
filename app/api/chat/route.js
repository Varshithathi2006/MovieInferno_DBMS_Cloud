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

        // 2. Fetch recent chat history for context (Context-Aware)
        // Adjust the LIMIT as needed (e.g., last 10 messages)
        const { data: history, error: historyError } = await supabase
            .from('chatbot_history')
            .select('role, content')
            .eq('user_id', userId)
            .order('timestamp', { ascending: true })
            .limit(10);

        if (historyError) throw historyError;

        // 3. Construct the conversation array for Gemini
        const conversation = history.map(h => ({
            role: h.role, 
            parts: [{ text: h.content }]
        }));
        
        // Add the current message
        conversation.push({ role: 'user', parts: [{ text: message }] });

        // 4. Define the AI's instruction (System Prompt)
        const systemPrompt = "You are a friendly, mood-based movie recommender named 'BingiBot'. Your suggestions must only be movies. If a user asks a general question, gently guide them back to movies. Respond with a compelling recommendation and a short, fun summary.";

        // 5. Call the Gemini API
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // A fast, capable model for chat
            contents: conversation,
            config: {
                systemInstruction: systemPrompt,
            },
        });

        const botResponse = response.text;

        // 6. Store the AI's response (Update Memory)
        await supabase.from('chatbot_history').insert({
            user_id: userId,
            role: 'model',
            content: botResponse,
        });

        // 7. Return the final text to the frontend
        return new Response(JSON.stringify({ text: botResponse }), { status: 200 });

    } catch (error) {
        console.error("Chatbot API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}