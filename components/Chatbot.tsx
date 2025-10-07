// components/Chatbot.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessageCircle, Send, User, Bot, AlertCircle } from 'lucide-react';

// --- Define the Message Interface ---
interface Message {
    role: 'user' | 'model' | 'error'; // Role must be one of these strings
    content: string;
    timestamp?: Date;
}

interface UserProfile {
    watchlistCount: number;
    reviewCount: number;
    favoriteGenres: string[];
}

export function Chatbot() {
    const [messages, setMessages] = useState<Message[]>([]); 
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check authentication and load user profile
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                await loadUserProfile(currentUser.id);
                await loadChatHistory(currentUser.id);
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    const loadUserProfile = async (userId: string) => {
        try {
            const [watchlistResult, reviewsResult] = await Promise.all([
                supabase.from('watchlist').select('media_type').eq('user_id', userId),
                supabase.from('reviews').select('rating').eq('user_id', userId)
            ]);

            setUserProfile({
                watchlistCount: watchlistResult.data?.length || 0,
                reviewCount: reviewsResult.data?.length || 0,
                favoriteGenres: [] // Could be enhanced with genre analysis
            });
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    };

    const loadChatHistory = async (userId: string) => {
        try {
            const { data: history } = await supabase
                .from('chatbot_history')
                .select('role, content, timestamp')
                .eq('user_id', userId)
                .order('timestamp', { ascending: true })
                .limit(20);

            if (history && history.length > 0) {
                const formattedHistory = history.map(h => ({
                    role: h.role as 'user' | 'model',
                    content: h.content,
                    timestamp: new Date(h.timestamp)
                }));
                setMessages(formattedHistory);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    };

    const getPersonalizedWelcome = () => {
        if (!user) return "Please log in to get personalized movie recommendations!";
        
        if (!userProfile) return "Welcome! I'm BingiBot, your personal movie companion.";

        const { watchlistCount, reviewCount } = userProfile;
        
        if (watchlistCount === 0 && reviewCount === 0) {
            return "Welcome to BingiBot! 🎬 I see you're new here. Tell me your mood and I'll recommend the perfect movie or TV show for you!";
        }
        
        if (watchlistCount > 0 && reviewCount > 0) {
            return `Welcome back! 🎭 I see you have ${watchlistCount} items in your watchlist and ${reviewCount} reviews. Based on your taste, I can give you personalized recommendations!`;
        }
        
        if (watchlistCount > 0) {
            return `Hi there! 🍿 I noticed you have ${watchlistCount} items in your watchlist. I can recommend similar content or help you decide what to watch next!`;
        }
        
        return `Welcome! 🎪 I see you've reviewed ${reviewCount} movies. I can use your ratings to suggest content that matches your taste!`;
    };

    const getSuggestedPrompts = () => [
        "I'm feeling nostalgic, suggest something classic",
        "I want something thrilling and suspenseful",
        "Recommend a feel-good comedy",
        "What should I watch based on my watchlist?",
        "I'm in the mood for a romantic movie"
    ];

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        // Check if user is authenticated
        if (!user) {
            const errorMessage: Message = { 
                role: 'error', 
                content: "Please log in to use the chat feature.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        const userMessage = input;
        const newUserMessage: Message = { 
            role: 'user', 
            content: userMessage,
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: user.id, 
                    message: userMessage 
                }),
            });

            if (!response.ok) {
                const errorDetails = await response.text(); 
                throw new Error(`AI service failed with status ${response.status}: ${errorDetails}`);
            }

            const data = await response.json();
            
            const botMessage: Message = { 
                role: 'model', 
                content: data.text,
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Chat Error:", error);
            const errorMessage: Message = { 
                role: 'error', 
                content: "Sorry, BingiBot is currently offline. Please try again later.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSuggestedPrompt = (prompt: string) => {
        setInput(prompt);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-card rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
                <MessageCircle className="h-6 w-6" />
                <div>
                    <h2 className="text-lg font-semibold">BingiBot</h2>
                    <p className="text-sm opacity-90">Your Personal Movie & TV Companion</p>
                </div>
            </div>

            {/* Message Display Area */}
            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-background">
                {messages.length === 0 && (
                    <div className="text-center space-y-4">
                        <div className="bg-muted/50 rounded-lg p-6">
                            <Bot className="h-12 w-12 mx-auto mb-3 text-primary" />
                            <p className="text-muted-foreground mb-4">{getPersonalizedWelcome()}</p>
                            
                            {user && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-foreground">Try asking:</p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {getSuggestedPrompts().map((prompt, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSuggestedPrompt(prompt)}
                                                className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 rounded-full transition-colors"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role !== 'user' && (
                            <div className="flex-shrink-0">
                                {msg.role === 'error' ? (
                                    <AlertCircle className="h-8 w-8 text-destructive" />
                                ) : (
                                    <Bot className="h-8 w-8 text-primary" />
                                )}
                            </div>
                        )}
                        
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground ml-auto' 
                                : msg.role === 'error'
                                ? 'bg-destructive/10 text-destructive border border-destructive/20'
                                : 'bg-muted text-foreground'
                        }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            {msg.timestamp && (
                                <p className="text-xs opacity-70 mt-1">
                                    {msg.timestamp.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                        
                        {msg.role === 'user' && (
                            <div className="flex-shrink-0">
                                <User className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex gap-3 justify-start">
                        <Bot className="h-8 w-8 text-primary flex-shrink-0" />
                        <div className="bg-muted rounded-lg p-3">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Form */}
            <div className="border-t bg-muted/30 p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={user ? "Ask me about movies, TV shows, or your mood..." : "Please log in to chat"}
                        disabled={isTyping || !user}
                        className="flex-1 px-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                    />
                    <button 
                        type="submit" 
                        disabled={isTyping || !input.trim() || !user}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <Send className="h-4 w-4" />
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}