// app/api/sync/route.js

import { supabase } from "../../../lib/supabaseClient";

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export async function GET() {
  // Fix: The URL string must be wrapped in backticks (`)
  const trendingUrl = `https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`;

  try {
    const trendingResponse = await fetch(trendingUrl, { cache: "no-store" });
    if (!trendingResponse.ok) throw new Error("TMDB trending API failed");

    const trendingData = await trendingResponse.json();
    if (!trendingData.results) throw new Error("No trending results found");

    for (const movie of trendingData.results) {
      // Fix: The URL string must be wrapped in backticks (`)
      const movieDetailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,reviews`;
      const detailsResponse = await fetch(movieDetailsUrl, { cache: "no-store" });
      if (!detailsResponse.ok) throw new Error("TMDB details API failed");

      const detailsData = await detailsResponse.json();

      // --- Movies table ---
      const movieToInsert = {
        id: detailsData.id,
        title: detailsData.title,
        release_date: detailsData.release_date,
        poster: detailsData.poster_path
          // Fix: The URL string must be wrapped in backticks (`)
          ? `https://image.tmdb.org/t/p/w500${detailsData.poster_path}`
          : null,
        synopsis: detailsData.overview,
        
      };

      // --- Genres ---
      const genresToInsert = detailsData.genres.map((g) => ({
        id: g.id,
        name: g.name,
      }));

      const movieGenresToInsert = detailsData.genres.map((g) => ({
        movie_id: detailsData.id,
        genre_id: g.id,
      }));

      // --- People (cast + crew) ---
      const peopleToInsert = [
        ...detailsData.credits.cast.map((p) => ({
          id: p.id,
          name: p.name,
          character: p.character,
          role: "cast",
          profile: p.profile_path
            // Fix: The URL string must be wrapped in backticks (`)
            ? `https://image.tmdb.org/t/p/w500${p.profile_path}`
            : null,
        })),
        ...detailsData.credits.crew.map((p) => ({
          id: p.id,
          name: p.name,
          job: p.job,
          role: "crew",
          profile: p.profile_path
            // Fix: The URL string must be wrapped in backticks (`)
            ? `https://image.tmdb.org/t/p/w500${p.profile_path}`
            : null,
        })),
      ];

      // --- Collections ---
      let collectionToInsert = null;
      if (detailsData.belongs_to_collection) {
        collectionToInsert = {
          id: detailsData.belongs_to_collection.id,
          name: detailsData.belongs_to_collection.name,
          poster: detailsData.belongs_to_collection.poster_path
            // Fix: The URL string must be wrapped in backticks (`)
            ? `https://image.tmdb.org/t/p/w500${detailsData.belongs_to_collection.poster_path}`
            : null,
        };
      }

      // --- Reviews ---
      const reviewsToInsert = detailsData.reviews?.results?.map((r) => ({
        id: r.id,
        movie_id: detailsData.id,
        author: r.author,
        content: r.content,
        created_at: r.created_at,
      })) ?? [];

      // --- Awards (dummy placeholder) ---
      const awardsToInsert = [
        {
          // Fix: The ID must be a string wrapped in backticks (`)
          id: `${detailsData.id}-award1`,
          movie_id: detailsData.id,
          name: "Best Picture (Placeholder)",
          year: 2025,
        },
      ];

      // --- Watchlist (dummy placeholder, since TMDB doesn’t provide user watchlists) ---
      const watchlistToInsert = [
        {
          // Fix: The ID must be a string wrapped in backticks (`)
          id: `${detailsData.id}-wl1`,
          movie_id: detailsData.id,
          user_id: "demo-user",
          added_at: new Date().toISOString(),
        },
      ];

      // --- Database inserts with full error logging ---
      const inserts = [
        { table: "movies", data: movieToInsert },
        { table: "genres", data: genresToInsert },
        { table: "movie_genres", data: movieGenresToInsert },
        { table: "people", data: peopleToInsert },
        { table: "collections", data: collectionToInsert ? [collectionToInsert] : [] },
        { table: "reviews", data: reviewsToInsert },
        { table: "awards", data: awardsToInsert },
        { table: "watchlist", data: watchlistToInsert },
      ];

      for (const { table, data } of inserts) {
        if (data && data.length !== 0) {
          const { error } = await supabase.from(table).upsert(data, { onConflict: "id" });
          // Fix: The string must be wrapped in backticks (`)
          if (error) console.error(`❌ Error inserting into ${table}:`, error.message);
          else console.log(`✅ Inserted into ${table}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ message: "All TMDB data synced successfully!" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("API Sync Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}