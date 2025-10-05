// API service for Movie Inferno
// This will handle all TMDB API calls

const API_BASE_URL = "https://api.themoviedb.org/3"
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY

// Mock data for when API key is not configured
const mockMovies: Movie[] = [
  {
    id: 1,
    title: "The Dark Knight",
    overview:
      "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.",
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_path: "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg",
    release_date: "2008-07-18",
    vote_average: 9.0,
    vote_count: 32000,
    genre_ids: [28, 80, 18],
    adult: false,
    original_language: "en",
    original_title: "The Dark Knight",
    popularity: 123.456,
    video: false,
  },
  {
    id: 2,
    title: "Inception",
    overview:
      "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.",
    poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    backdrop_path: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    release_date: "2010-07-16",
    vote_average: 8.8,
    vote_count: 35000,
    genre_ids: [28, 878, 53],
    adult: false,
    original_language: "en",
    original_title: "Inception",
    popularity: 98.765,
    video: false,
  },
  {
    id: 3,
    title: "Interstellar",
    overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdrop_path: "/pbrkL804c8yAv3zBZR4QPWZAAn8.jpg",
    release_date: "2014-11-07",
    vote_average: 8.6,
    vote_count: 28000,
    genre_ids: [18, 878],
    adult: false,
    original_language: "en",
    original_title: "Interstellar",
    popularity: 87.432,
    video: false,
  },
]

const mockTVShows: TVShow[] = [
  {
    id: 1,
    name: "Breaking Bad",
    overview:
      "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.",
    poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    first_air_date: "2008-01-20",
    vote_average: 9.5,
    vote_count: 15000,
    genre_ids: [18, 80],
    origin_country: ["US"],
    original_language: "en",
    original_name: "Breaking Bad",
    popularity: 234.567,
  },
  {
    id: 2,
    name: "Game of Thrones",
    overview: "Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns.",
    poster_path: "/u3bZfeN0moxb9IPfGn8AIqMGskD.jpg",
    backdrop_path: "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
    first_air_date: "2011-04-17",
    vote_average: 9.3,
    vote_count: 22000,
    genre_ids: [18, 10765, 10759],
    origin_country: ["US"],
    original_language: "en",
    original_name: "Game of Thrones",
    popularity: 189.432,
  },
  {
    id: 3,
    name: "Stranger Things",
    overview:
      "When a young boy vanishes, a small town uncovers a mystery involving secret experiments and supernatural forces.",
    poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    first_air_date: "2016-07-15",
    vote_average: 8.7,
    vote_count: 18000,
    genre_ids: [18, 10765, 9648],
    origin_country: ["US"],
    original_language: "en",
    original_name: "Stranger Things",
    popularity: 156.789,
  },
]

const mockApiResponse: ApiResponse<Movie> = {
  page: 1,
  results: mockMovies,
  total_pages: 1,
  total_results: mockMovies.length,
}

const mockTVApiResponse: ApiResponse<TVShow> = {
  page: 1,
  results: mockTVShows,
  total_pages: 1,
  total_results: mockTVShows.length,
}

const mockMovieGenres = {
  genres: [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Science Fiction" },
    { id: 10770, name: "TV Movie" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" },
  ],
}

const mockTVGenres = {
  genres: [
    { id: 10759, name: "Action & Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 10762, name: "Kids" },
    { id: 9648, name: "Mystery" },
    { id: 10763, name: "News" },
    { id: 10764, name: "Reality" },
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 10766, name: "Soap" },
    { id: 10767, name: "Talk" },
    { id: 10768, name: "War & Politics" },
    { id: 37, name: "Western" },
  ],
}

const mockMovieDetails: Movie = {
  id: 3,
  title: "Interstellar",
  overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
  poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
  backdrop_path: "/pbrkL804c8yAv3zBZR4QPWZAAn8.jpg",
  release_date: "2014-11-07",
  vote_average: 8.6,
  vote_count: 28000,
  genre_ids: [18, 878],
  adult: false,
  original_language: "en",
  original_title: "Interstellar",
  popularity: 87.432,
  video: false,
  runtime: 169,
  genres: [
    { id: 18, name: "Drama" },
    { id: 878, name: "Science Fiction" },
  ],
  production_companies: [
    { id: 1, name: "Syncopy", logo_path: "/logo1.png" },
    { id: 2, name: "Legendary Pictures", logo_path: "/logo2.png" },
  ],
  production_countries: [{ iso_3166_1: "US", name: "United States of America" }],
  spoken_languages: [{ iso_639_1: "en", name: "English" }],
  status: "Released",
  tagline: "Mankind was born on Earth. It was never meant to die here.",
  budget: 165000000,
  revenue: 677471339,
}

const mockCredits: Credits = {
  cast: [
    {
      id: 1,
      name: "Matthew McConaughey",
      character: "Cooper",
      profile_path: "/sY2mwpafcwqyYS1sOySu1MENDse.jpg",
      order: 0,
    },
    {
      id: 2,
      name: "Anne Hathaway",
      character: "Brand",
      profile_path: "/di6Cp0Ke7lwajpFWlGGtqzjGgAz.jpg",
      order: 1,
    },
    {
      id: 3,
      name: "Jessica Chastain",
      character: "Murph",
      profile_path: "/vOFrDeYXILnj747dOleaNh4jK3l.jpg",
      order: 2,
    },
    {
      id: 4,
      name: "Michael Caine",
      character: "Professor Brand",
      profile_path: "/bVZRMlpjTAO2pJK6v90buFgVbSW.jpg",
      order: 3,
    },
  ],
  crew: [
    {
      id: 5,
      name: "Christopher Nolan",
      job: "Director",
      department: "Directing",
      profile_path: "/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg",
    },
  ],
}

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
  genres?: Array<{ id: number; name: string }>
  production_companies?: Array<{ id: number; name: string; logo_path: string | null }>
  production_countries?: Array<{ iso_3166_1: string; name: string }>
  spoken_languages?: Array<{ iso_639_1: string; name: string }>
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
  popularity: number
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
  cast: Cast[]
  crew: Crew[]
}

// Helper function to build image URLs
export const getImageUrl = (path: string | null, size = "w500"): string => {
  if (!path) return "/abstract-movie-poster.png"
  return `https://image.tmdb.org/t/p/${size}${path}`
}

// Generic API fetch function
async function fetchFromAPI<T>(endpoint: string): Promise<T> {
  // Check if API key is configured
  if (!API_KEY || API_KEY === "demo_key") {
    console.log("[v0] No TMDB API key configured, using mock data")

    // Return mock data for various endpoints
    if (
      endpoint.includes("/trending/movie") ||
      endpoint.includes("/movie/popular") ||
      endpoint.includes("/movie/top_rated") ||
      endpoint.includes("/movie/upcoming")
    ) {
      return mockApiResponse as T
    }

    if (
      endpoint.includes("/trending/tv") ||
      endpoint.includes("/tv/popular") ||
      endpoint.includes("/tv/top_rated") ||
      endpoint.includes("/tv/airing_today") ||
      endpoint.includes("/tv/on_the_air")
    ) {
      return mockTVApiResponse as T
    }

    if (endpoint.includes("/genre/movie/list")) {
      return mockMovieGenres as T
    }

    if (endpoint.includes("/genre/tv/list")) {
      return mockTVGenres as T
    }

    // Handle movie details endpoints
    if (endpoint.match(/\/movie\/\d+$/)) {
      return mockMovieDetails as T
    }

    // Handle movie credits endpoints
    if (endpoint.match(/\/movie\/\d+\/credits$/)) {
      return mockCredits as T
    }

    // Handle similar movies endpoints
    if (endpoint.match(/\/movie\/\d+\/similar$/)) {
      return { ...mockApiResponse, results: mockMovies.slice(0, 2) } as T
    }

    // For other endpoints, throw a more specific error
    throw new Error("TMDB API key not configured. Please add NEXT_PUBLIC_TMDB_API_KEY to your environment variables.")
  }

  const url = `${API_BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${API_KEY}`

  try {
    console.log("[v0] Making API request to:", url.replace(API_KEY, "***"))
    const response = await fetch(url)
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid TMDB API key. Please check your NEXT_PUBLIC_TMDB_API_KEY environment variable.")
      }
      throw new Error(`API request failed: ${response.status}`)
    }
    const data = await response.json()
    console.log("[v0] API request successful")
    return data
  } catch (error) {
    console.error("[v0] API fetch error:", error)
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
  getMovieGenres: () => fetchFromAPI<{ genres: Array<{ id: number; name: string }> }>("/genre/movie/list"),
  getTVGenres: () => fetchFromAPI<{ genres: Array<{ id: number; name: string }> }>("/genre/tv/list"),
  getMoviesByGenre: (genreId: number, page = 1) =>
    fetchFromAPI<ApiResponse<Movie>>(`/discover/movie?with_genres=${genreId}&page=${page}`),
  getTVByGenre: (genreId: number, page = 1) =>
    fetchFromAPI<ApiResponse<TVShow>>(`/discover/tv?with_genres=${genreId}&page=${page}`),
}
