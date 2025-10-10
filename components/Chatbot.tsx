// components/Chatbot.tsx

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessageCircle, Send, User, Bot, AlertCircle, Sparkles, Zap, Star } from 'lucide-react';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

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
        
        if (!userProfile) return "Hi! I'm BingiBot, your personal movie and TV companion. What are you in the mood to watch?";

        const { watchlistCount, reviewCount, favoriteGenres } = userProfile;
        
        if (watchlistCount === 0 && reviewCount === 0 && favoriteGenres.length === 0) {
            return "Welcome to BingiBot! I'm here to help you discover amazing movies and TV shows tailored to your taste. Tell me about your favorite genres or what you're in the mood for!";
        }
        
        let welcome = "Welcome back! 🎬 ";
        
        // More personalized greetings based on activity level
        if (watchlistCount > 10 && reviewCount > 5) {
            welcome += `I can see you're a true cinephile with **${watchlistCount} watchlist items** and **${reviewCount} reviews**! `;
        } else if (watchlistCount > 0) {
            welcome += `I see you have **${watchlistCount} items** in your watchlist. `;
        }
        
        if (reviewCount > 0) {
            welcome += `Your **${reviewCount} thoughtful reviews** help me understand your taste better. `;
        }
        
        if (favoriteGenres.length > 0) {
            const genreText = favoriteGenres.length > 2 
                ? `**${favoriteGenres.slice(0, 2).join('**, **')}** and more` 
                : `**${favoriteGenres.join('** and **')}**`;
            welcome += `I know you enjoy ${genreText}, so I'm ready to suggest something perfect for your mood based on your viewing history!`;
        } else {
            welcome += "What kind of experience are you looking for today?";
        }
        
        return welcome;
    };

    const getSuggestedPrompts = () => {
        if (!userProfile) return [
            "Recommend something based on my mood",
            "What's a hidden gem I should watch?",
            "I want something uplifting and fun",
            "Suggest a critically acclaimed film"
        ];

        const { favoriteGenres, watchlistCount, reviewCount } = userProfile;
        const prompts = [];

        // Genre-based prompts with enhanced personalization
        if (favoriteGenres.length > 0) {
            const primaryGenre = favoriteGenres[0].toLowerCase();
            prompts.push(`Recommend a ${primaryGenre} movie I haven't seen yet`);
            
            if (favoriteGenres.length > 1) {
                const secondaryGenre = favoriteGenres[1].toLowerCase();
                prompts.push(`Something that blends ${primaryGenre} and ${secondaryGenre}`);
            }
            
            // Add genre-specific mood prompts
            if (favoriteGenres.length > 2) {
                const tertiaryGenre = favoriteGenres[2].toLowerCase();
                prompts.push(`Surprise me with a ${tertiaryGenre} hidden gem`);
            }
        }
        
        // Activity-based prompts with more context
        if (watchlistCount > 10) {
            prompts.push("Help me prioritize my extensive watchlist");
        } else if (watchlistCount > 5) {
            prompts.push("What should I watch next from my list?");
        } else if (watchlistCount > 0) {
            prompts.push("Help me decide what to watch from my saved items");
        }
        
        // Experience-based prompts with review integration
        if (reviewCount > 5) {
            prompts.push("Based on my viewing patterns, what's perfect for tonight?");
        } else if (reviewCount > 3) {
            prompts.push("Considering my reviews, what would I love?");
        }
        
        // Enhanced mood and discovery prompts
        const moodPrompts = [
            "I'm feeling nostalgic, suggest something classic",
            "I want to discover an underrated masterpiece",
            "Something perfect for a cozy weekend binge",
            "I'm in the mood for something thought-provoking",
            "Recommend something that will make me laugh out loud",
            "I want an emotional, meaningful story that will stay with me",
            "Suggest something trending that matches my taste",
            "I'm looking for a comfort watch I can rewatch"
        ];
        
        // Add mood prompts to fill remaining slots
        const remainingSlots = Math.max(0, 4 - prompts.length);
        const shuffledMoodPrompts = moodPrompts.sort(() => 0.5 - Math.random());
        prompts.push(...shuffledMoodPrompts.slice(0, remainingSlots));
        
        return prompts.slice(0, 4);
    };

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
                <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Bot className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-card via-card to-card/95 rounded-2xl shadow-2xl overflow-hidden border border-border/50 backdrop-blur-sm">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                <div className="relative flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-primary-foreground/30">
                            <Bot className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-primary animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold">BingiBot</h2>
                            <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
                        </div>
                        <p className="text-sm opacity-90 flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Your AI-Powered Movie & TV Companion
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs bg-primary-foreground/10 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        Online
                    </div>
                </div>
            </div>

            {/* Enhanced Message Display Area */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-background/50 to-background relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
                </div>
                
                {messages.length === 0 && (
                    <div className="text-center space-y-6 relative z-10">
                        <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-2xl p-8 backdrop-blur-sm border border-border/50">
                            <div className="relative mb-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                    <Bot className="h-10 w-10 text-primary" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                                    <Sparkles className="h-3 w-3 text-yellow-800" />
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-foreground">Welcome to BingiBot! 🎬</h3>
                                <p className="text-muted-foreground leading-relaxed">{getPersonalizedWelcome()}</p>
                            </div>
                            
                            {user && (
                                <div className="space-y-4 mt-6">
                                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                                        <Star className="h-4 w-4 text-yellow-500" />
                                        Try these personalized suggestions:
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {getSuggestedPrompts().map((prompt, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSuggestedPrompt(prompt)}
                                                className="group text-sm bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 text-primary px-4 py-3 rounded-xl transition-all duration-300 text-left border border-primary/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transform hover:-translate-y-0.5"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-primary rounded-full group-hover:animate-pulse"></div>
                                                    {prompt}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {userProfile && (userProfile.watchlistCount > 0 || userProfile.reviewCount > 0 || userProfile.favoriteGenres.length > 0) && (
                                        <div className="text-xs text-muted-foreground text-center pt-4 border-t border-muted/50 flex items-center justify-center gap-2">
                                            <Sparkles className="h-3 w-3 text-primary" />
                                            These suggestions are personalized based on your viewing history
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`} style={{animationDelay: `${index * 100}ms`}}>
                        {msg.role !== 'user' && (
                            <div className="flex-shrink-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    msg.role === 'error' 
                                        ? 'bg-destructive/20 border border-destructive/30' 
                                        : 'bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30'
                                }`}>
                                    {msg.role === 'error' ? (
                                        <AlertCircle className="h-5 w-5 text-destructive" />
                                    ) : (
                                        <Bot className="h-5 w-5 text-primary" />
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className={`max-w-[85%] rounded-2xl p-4 relative ${
                            msg.role === 'user' 
                                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ml-auto shadow-lg' 
                                : msg.role === 'error'
                                ? 'bg-gradient-to-br from-destructive/10 to-destructive/5 text-destructive border border-destructive/20'
                                : 'bg-gradient-to-br from-muted/80 to-muted/60 text-foreground border border-border/50 shadow-sm'
                        }`}>
                            {/* Message bubble tail */}
                            <div className={`absolute top-4 w-3 h-3 transform rotate-45 ${
                                msg.role === 'user' 
                                    ? 'bg-primary -right-1.5' 
                                    : msg.role === 'error'
                                    ? 'bg-destructive/10 -left-1.5 border-l border-t border-destructive/20'
                                    : 'bg-muted/80 -left-1.5 border-l border-t border-border/50'
                            }`}></div>
                            
                            <div className="whitespace-pre-wrap leading-relaxed space-y-3 relative z-10">
                                {msg.content.split('\n').map((line, lineIndex) => {
                                    // Enhanced bullet points
                                    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                                        return (
                                            <div key={lineIndex} className="flex items-start gap-3 my-2">
                                                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-0.5">
                                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                </div>
                                                <span className="flex-1">{line.replace(/^[•\-]\s*/, '')}</span>
                                            </div>
                                        );
                                    }
                                    // Enhanced numbered lists
                                    if (/^\d+\./.test(line.trim())) {
                                        return (
                                            <div key={lineIndex} className="flex items-start gap-3 my-2">
                                                <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                                                    {line.match(/^\d+/)?.[0]}
                                                </div>
                                                <span className="flex-1 pt-1">{line.replace(/^\d+\.\s*/, '')}</span>
                                            </div>
                                        );
                                    }
                                    // Enhanced movie/TV titles
                                    if (line.includes('**')) {
                                        const parts = line.split(/(\*\*.*?\*\*)/);
                                        return (
                                            <p key={lineIndex} className="leading-relaxed">
                                                {parts.map((part, partIndex) => 
                                                    part.startsWith('**') && part.endsWith('**') ? (
                                                        <span key={partIndex} className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                                            {part.slice(2, -2)}
                                                        </span>
                                                    ) : (
                                                        <span key={partIndex}>{part}</span>
                                                    )
                                                )}
                                            </p>
                                        );
                                    }
                                    // Handle year mentions with special styling
                                    if (/\(\d{4}\)/.test(line)) {
                                        const yearFormatted = line.replace(/\((\d{4})\)/g, '<span class="text-muted-foreground text-sm bg-muted/50 px-1 rounded">($1)</span>');
                                        return (
                                            <p key={lineIndex} dangerouslySetInnerHTML={{ __html: yearFormatted }} />
                                        );
                                    }
                                    // Handle ratings with special styling
                                    if (/(\d+\.?\d*\/10|\d+\.?\d*%)/.test(line)) {
                                        const ratingFormatted = line.replace(/(\d+\.?\d*\/10|\d+\.?\d*%)/g, '<span class="font-medium text-green-600 bg-green-50 px-1 rounded">⭐ $1</span>');
                                        return (
                                            <p key={lineIndex} dangerouslySetInnerHTML={{ __html: ratingFormatted }} />
                                        );
                                    }
                                    // Regular lines with emoji enhancement
                                    const enhancedLine = line
                                        .replace(/🎬/g, '<span class="text-lg">🎬</span>')
                                        .replace(/🍿/g, '<span class="text-lg">🍿</span>')
                                        .replace(/📺/g, '<span class="text-lg">📺</span>');
                                    
                                    return line.trim() ? (
                                        enhancedLine !== line ? 
                                            <p key={lineIndex} dangerouslySetInnerHTML={{ __html: enhancedLine }} /> :
                                            <p key={lineIndex}>{line}</p>
                                    ) : <br key={lineIndex} />;
                                })}
                            </div>
                            {msg.timestamp && (
                                <p className="text-xs opacity-60 mt-3 flex items-center gap-1">
                                    <div className="w-1 h-1 bg-current rounded-full"></div>
                                    {msg.timestamp.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                        
                        {msg.role === 'user' && (
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-to-br from-muted to-muted/80 rounded-full flex items-center justify-center border border-border/50">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex gap-4 justify-start animate-in slide-in-from-bottom-2 duration-300">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border border-primary/30">
                            <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div className="bg-gradient-to-br from-muted/80 to-muted/60 rounded-2xl p-4 border border-border/50 relative">
                            <div className="absolute top-4 w-3 h-3 bg-muted/80 transform rotate-45 -left-1.5 border-l border-t border-border/50"></div>
                            <div className="flex space-x-2 items-center">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                                <span className="text-xs text-muted-foreground ml-2">BingiBot is thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Input Form */}
            <div className="border-t bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 p-6 backdrop-blur-sm">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={user ? "Ask me about movies, TV shows, or describe your mood..." : "Please log in to chat with BingiBot"}
                            disabled={isTyping || !user}
                            className="w-full px-6 py-4 border border-input bg-background/80 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 disabled:opacity-50 placeholder:text-muted-foreground/70 transition-all duration-300 shadow-sm hover:shadow-md"
                        />
                        {input && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                            </div>
                        )}
                    </div>
                    <button 
                        type="submit" 
                        disabled={isTyping || !input.trim() || !user}
                        className="px-6 py-4 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-2xl hover:from-primary/90 hover:to-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 min-w-[120px] shadow-lg hover:shadow-xl hover:shadow-primary/20 transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Send className="h-5 w-5" />
                        <span className="font-medium">{isTyping ? 'Sending...' : 'Send'}</span>
                    </button>
                </form>
                
                {!user && (
                    <div className="mt-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            Please <span className="text-primary font-medium">log in</span> to start chatting with BingiBot
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}