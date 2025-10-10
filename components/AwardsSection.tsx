// components/AwardsSection.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Award, Trophy, Star, Calendar, Film, Search, Filter, ChevronDown, Medal, Crown } from 'lucide-react';
import Link from 'next/link';

interface AwardData {
    id: number;
    movie_id: number;
    name: string;
    category: string;
    year: number;
    won: number;
    created_at: string;
    movie?: {
        title: string;
        poster_path: string;
        release_date: string;
    };
}

interface AwardsSectionProps {
    limit?: number;
    showSearch?: boolean;
    showFilters?: boolean;
    title?: string;
}

export function AwardsSection({ 
    limit = 20, 
    showSearch = true, 
    showFilters = true, 
    title = "Movie Awards & Recognition" 
}: AwardsSectionProps) {
    const [awards, setAwards] = useState<AwardData[]>([]);
    const [filteredAwards, setFilteredAwards] = useState<AwardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedYear, setSelectedYear] = useState('all');
    const [wonFilter, setWonFilter] = useState('all');
    const [categories, setCategories] = useState<string[]>([]);
    const [years, setYears] = useState<number[]>([]);

    useEffect(() => {
        fetchAwards();
    }, [limit]);

    useEffect(() => {
        filterAwards();
    }, [awards, searchTerm, selectedCategory, selectedYear, wonFilter]);

    const fetchAwards = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch awards with movie details
            const { data: awardsData, error: awardsError } = await supabase
                .from('awards')
                .select(`
                    *,
                    movies:movie_id (
                        title,
                        poster_path,
                        release_date
                    )
                `)
                .order('year', { ascending: false })
                .limit(limit);

            if (awardsError) {
                throw awardsError;
            }

            const processedAwards = awardsData?.map(award => ({
                ...award,
                movie: award.movies
            })) || [];

            setAwards(processedAwards);

            // Extract unique categories and years for filters
            const uniqueCategories = [...new Set(processedAwards.map(award => award.category))];
            const uniqueYears = [...new Set(processedAwards.map(award => award.year))].sort((a, b) => b - a);
            
            setCategories(uniqueCategories);
            setYears(uniqueYears);

        } catch (err) {
            console.error('Error fetching awards:', err);
            setError('Failed to load awards data');
        } finally {
            setLoading(false);
        }
    };

    const filterAwards = () => {
        let filtered = awards;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(award =>
                award.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                award.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                award.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(award => award.category === selectedCategory);
        }

        // Year filter
        if (selectedYear !== 'all') {
            filtered = filtered.filter(award => award.year === parseInt(selectedYear));
        }

        // Won filter
        if (wonFilter !== 'all') {
            filtered = filtered.filter(award => 
                wonFilter === 'won' ? award.won === 1 : award.won === 0
            );
        }

        setFilteredAwards(filtered);
    };

    const getAwardIcon = (awardName: string, won: number) => {
        const name = awardName.toLowerCase();
        if (name.includes('oscar') || name.includes('academy')) {
            return won === 1 ? <Crown className="h-5 w-5 text-yellow-500" /> : <Crown className="h-5 w-5 text-gray-400" />;
        } else if (name.includes('golden globe')) {
            return won === 1 ? <Medal className="h-5 w-5 text-yellow-600" /> : <Medal className="h-5 w-5 text-gray-400" />;
        } else if (name.includes('emmy')) {
            return won === 1 ? <Trophy className="h-5 w-5 text-purple-500" /> : <Trophy className="h-5 w-5 text-gray-400" />;
        } else {
            return won === 1 ? <Award className="h-5 w-5 text-blue-500" /> : <Award className="h-5 w-5 text-gray-400" />;
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
                    <div className="h-6 bg-primary/20 rounded w-48 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-card rounded-xl p-6 border border-border/50 animate-pulse">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-muted rounded-lg"></div>
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 bg-muted rounded w-3/4"></div>
                                    <div className="h-3 bg-muted rounded w-1/2"></div>
                                    <div className="h-3 bg-muted rounded w-2/3"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 max-w-md mx-auto">
                    <Award className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Awards</h3>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <button 
                        onClick={fetchAwards}
                        className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-full flex items-center justify-center border border-yellow-500/30">
                        <Trophy className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                        <p className="text-sm text-muted-foreground">
                            Celebrating excellence in cinema • {filteredAwards.length} awards
                        </p>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            {(showSearch || showFilters) && (
                <div className="bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 rounded-2xl p-6 backdrop-blur-sm border border-border/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {showSearch && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search awards, movies..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                                />
                            </div>
                        )}

                        {showFilters && (
                            <>
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full pl-10 pr-8 py-3 bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 appearance-none"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>

                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="w-full pl-10 pr-8 py-3 bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 appearance-none"
                                    >
                                        <option value="all">All Years</option>
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>

                                <div className="relative">
                                    <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <select
                                        value={wonFilter}
                                        onChange={(e) => setWonFilter(e.target.value)}
                                        className="w-full pl-10 pr-8 py-3 bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 appearance-none"
                                    >
                                        <option value="all">All Awards</option>
                                        <option value="won">Winners Only</option>
                                        <option value="nominated">Nominations Only</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Awards Grid */}
            {filteredAwards.length === 0 ? (
                <div className="text-center py-12">
                    <div className="bg-muted/50 rounded-2xl p-8 max-w-md mx-auto">
                        <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Awards Found</h3>
                        <p className="text-sm text-muted-foreground">
                            {searchTerm || selectedCategory !== 'all' || selectedYear !== 'all' || wonFilter !== 'all'
                                ? 'Try adjusting your search or filter criteria'
                                : 'No awards data available at the moment'
                            }
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAwards.map((award, index) => (
                        <div 
                            key={award.id} 
                            className="group bg-gradient-to-br from-card via-card to-card/95 rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 transform hover:-translate-y-1 backdrop-blur-sm"
                            style={{animationDelay: `${index * 50}ms`}}
                        >
                            <div className="flex items-start gap-4">
                                {/* Award Icon */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                                    award.won === 1 
                                        ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 group-hover:from-yellow-500/30 group-hover:to-yellow-600/30' 
                                        : 'bg-gradient-to-br from-muted/50 to-muted/30 border-muted/50 group-hover:from-muted/60 group-hover:to-muted/40'
                                }`}>
                                    {getAwardIcon(award.name, award.won)}
                                </div>

                                {/* Award Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">
                                            {award.name}
                                        </h3>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                            award.won === 1 
                                                ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                                                : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                        }`}>
                                            {award.won === 1 ? 'Winner' : 'Nominated'}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-medium">Category:</span> {award.category}
                                        </p>
                                        
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            <span>{award.year}</span>
                                        </div>

                                        {award.movie && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Film className="h-3 w-3 text-primary" />
                                                <Link 
                                                    href={`/movies/${award.movie_id}`}
                                                    className="text-primary hover:text-primary/80 transition-colors font-medium truncate"
                                                >
                                                    {award.movie.title}
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Hover Effect Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Load More Button (if needed) */}
            {awards.length >= limit && (
                <div className="text-center pt-6">
                    <button 
                        onClick={() => fetchAwards()}
                        className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary/80 transition-all duration-300 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl hover:shadow-primary/20 transform hover:-translate-y-0.5"
                    >
                        <Trophy className="h-4 w-4" />
                        View More Awards
                    </button>
                </div>
            )}
        </div>
    );
}