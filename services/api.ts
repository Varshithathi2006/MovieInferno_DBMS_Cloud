// API service for Movie Inferno
// This handles all TMDB API calls with real-time data only

const API_BASE_URL = "https://api.themoviedb.org/3"
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY

// Cache for API responses (5 minutes)
const apiCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Type definitions
export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  adult: boolean
  original_language: string
  original_title: string
  popularity: number
  video: boolean
  runtime?: number
  genres?: Genre[]
  production_companies?: ProductionCompany[]
  production_countries?: ProductionCountry[]
  spoken_languages?: SpokenLanguage[]
  status?: string
  tagline?: string
  budget?: number
  revenue?: number
}

export interface TVShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  adult: boolean
  origin_country: string[]
  original_language: string
  original_name: string
  popularity: number
}

export interface Person {
  id: number
  name: string
  profile_path: string | null
  adult: boolean
  known_for_department: string
  known_for: (Movie | TVShow)[]
  popularity: number
}

export interface Genre {
  id: number
  name: string
}

export interface ProductionCompany {
  id: number
  logo_path: string | null
  name: string
  origin_country: string
}

export interface ProductionCountry {
  iso_3166_1: string
  name: string
}

export interface SpokenLanguage {
  english_name: string
  iso_639_1: string
  name: string
}

export interface ApiResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export interface Cast {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface Crew {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
}

export interface Credits {
  id: number
  cast: Cast[]
  crew: Crew[]
}

export interface Video {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
  published_at: string
  size: number
}

export interface VideoResponse {
  id: number
  results: Video[]
}

// Utility function to get image URLs
export const getImageUrl = (path: string | null, size: string = "w500"): string => {
  if (!path) return "/placeholder.svg"
  return `https://image.tmdb.org/t/p/${size}${path}`
}

// Main fetch function for TMDB API
async function fetchFromAPI<T>(endpoint: string): Promise<T> {
  // Check if API key is configured
  if (!API_KEY) {
    throw new Error("TMDB API key not configured. Please add NEXT_PUBLIC_TMDB_API_KEY to your environment variables.")
  }

  // Check cache first
  const cacheKey = endpoint
  const cached = apiCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("[API] Using cached data for:", endpoint)
    return cached.data
  }

  const url = `${API_BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${API_KEY}`

  try {
    console.log("[API] Making request to:", endpoint)
    const response = await fetch(url)
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid TMDB API key. Please check your NEXT_PUBLIC_TMDB_API_KEY environment variable.")
      }
      if (response.status === 404) {
        throw new Error("Resource not found")
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log("[API] Request successful for:", endpoint)
    
    // Cache the response
    apiCache.set(cacheKey, { data, timestamp: Date.now() })
    
    return data
  } catch (error) {
    console.error("[API] Fetch error for", endpoint, ":", error)
    throw error
  }
}

// Movie API functions
export const movieApi = {
  getTrending: () => fetchFromAPI<ApiResponse<Movie>>("/trending/movie/week"),
  getPopular: () => fetchFromAPI<ApiResponse<Movie>>("/movie/popular"),
  getTopRated: () => fetchFromAPI<ApiResponse<Movie>>("/movie/top_rated"),
  getUpcoming: () => fetchFromAPI<ApiResponse<Movie>>("/movie/upcoming"),
  getNowPlaying: () => fetchFromAPI<ApiResponse<Movie>>("/movie/now_playing"),
  getDetails: (id: number) => fetchFromAPI<Movie>(`/movie/${id}`),
  getCredits: (id: number) => fetchFromAPI<Credits>(`/movie/${id}/credits`),
  getVideos: (id: number) => fetchFromAPI<VideoResponse>(`/movie/${id}/videos`),
  getSimilar: (id: number) => fetchFromAPI<ApiResponse<Movie>>(`/movie/${id}/similar`),
  getRecommendations: (id: number) => fetchFromAPI<ApiResponse<Movie>>(`/movie/${id}/recommendations`),
  search: (query: string, page = 1) =>
    fetchFromAPI<ApiResponse<Movie>>(`/search/movie?query=${encodeURIComponent(query)}&page=${page}`),
}

// TV Show API functions
export const tvApi = {
  getTrending: () => fetchFromAPI<ApiResponse<TVShow>>("/trending/tv/week"),
  getPopular: () => fetchFromAPI<ApiResponse<TVShow>>("/tv/popular"),
  getTopRated: () => fetchFromAPI<ApiResponse<TVShow>>("/tv/top_rated"),
  getAiringToday: () => fetchFromAPI<ApiResponse<TVShow>>("/tv/airing_today"),
  getOnTheAir: () => fetchFromAPI<ApiResponse<TVShow>>("/tv/on_the_air"),
  getDetails: (id: number) => fetchFromAPI<TVShow>(`/tv/${id}`),
  getCredits: (id: number) => fetchFromAPI<Credits>(`/tv/${id}/credits`),
  getVideos: (id: number) => fetchFromAPI<VideoResponse>(`/tv/${id}/videos`),
  getSimilar: (id: number) => fetchFromAPI<ApiResponse<TVShow>>(`/tv/${id}/similar`),
  search: (query: string, page = 1) =>
    fetchFromAPI<ApiResponse<TVShow>>(`/search/tv?query=${encodeURIComponent(query)}&page=${page}`),
}

// Person API functions
export const personApi = {
  getPopular: () => fetchFromAPI<ApiResponse<Person>>("/person/popular"),
  getDetails: (id: number) => fetchFromAPI<Person>(`/person/${id}`),
  search: (query: string, page = 1) =>
    fetchFromAPI<ApiResponse<Person>>(`/search/person?query=${encodeURIComponent(query)}&page=${page}`),
}

// Genre API functions
export const genreApi = {
  getMovieGenres: () => fetchFromAPI<{ genres: Genre[] }>("/genre/movie/list"),
  getTVGenres: () => fetchFromAPI<{ genres: Genre[] }>("/genre/tv/list"),
  getMoviesByGenre: (genreId: number, page = 1) => 
    fetchFromAPI<ApiResponse<Movie>>(`/discover/movie?with_genres=${genreId}&page=${page}`),
  getTVByGenre: (genreId: number, page = 1) => 
    fetchFromAPI<ApiResponse<TVShow>>(`/discover/tv?with_genres=${genreId}&page=${page}`),
}

// Multi-search function
export const multiSearch = (query: string, page = 1) =>
  fetchFromAPI<ApiResponse<Movie | TVShow | Person>>(`/search/multi?query=${encodeURIComponent(query)}&page=${page}`)

// Discover functions
export const discoverApi = {
  movies: (params: Record<string, string | number> = {}) => {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value.toString())
    })
    return fetchFromAPI<ApiResponse<Movie>>(`/discover/movie?${queryParams.toString()}`)
  },
  tv: (params: Record<string, string | number> = {}) => {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value.toString())
    })
    return fetchFromAPI<ApiResponse<TVShow>>(`/discover/tv?${queryParams.toString()}`)
  },
}
