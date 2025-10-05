// components/Chatbot.tsx

import React, { useState } from 'react';
// Import any UI components needed (e.g., from "@/components/ui/button")

// --- FIX 1: Define the Message Interface (Critical for TypeScript) ---
interface Message {
    role: 'user' | 'model' | 'error'; // Role must be one of these strings
    content: string;
}
// ------------------------------------------------------------------

// NOTE: We use your sample ID for testing. 
const TEST_USER_ID = '00a4d6a7-4f64-41b1-ba41-1e0acc587677'; 

export function Chatbot() {
    // FIX 2: Explicitly type the state array as an array of Message objects
    const [messages, setMessages] = useState<Message[]>([]); 
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => { // FIX 3: Explicitly type the event
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMessage = input;
        
        // FIX 4: The object is now correctly typed
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: TEST_USER_ID, 
                    message: userMessage 
                }),
            });

            if (!response.ok) {
                // FIX 5: Use string interpolation for clearer error
                const errorDetails = await response.text(); 
                throw new Error(`AI service failed with status ${response.status}: ${errorDetails}`);
            }

            const data = await response.json();
            
            // FIX 6: Explicitly type botMessage
            const botMessage: Message = { role: 'model', content: data.text };
            
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Chat Error:", error);
            // FIX 7: Explicitly type errorMessage
            const errorMessage: Message = { 
                role: 'error', 
                content: "Sorry, BingiBot is currently offline or the request failed." 
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="chat-interface-wrapper">
            {/* Message Display Area */}
            <div className="chat-history-display">
                {messages.length === 0 && <p className="welcome-msg">Ask me for a movie based on your mood (e.g., "I need a comforting comedy").</p>}
                {messages.map((msg, index) => (
                    // FIX 8: All properties (role, content) are now correctly typed and accessible
                    <div key={index} className={`chat-bubble chat-bubble-${msg.role}`}>
                        <span className="chat-role">{msg.role === 'user' ? 'You' : 'BingiBot'}:</span>
                        {msg.content} 
                    </div>
                ))}
                {isTyping && <div className="typing-indicator">BingiBot is thinking...</div>}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your mood or question here..."
                    disabled={isTyping}
                />
                <button type="submit" disabled={isTyping || !input.trim()}>Send</button>
            </form>
        </div>
    );
}