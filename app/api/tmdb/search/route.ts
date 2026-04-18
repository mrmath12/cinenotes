import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";

  if (query.length < 4) {
    return NextResponse.json(
      { error: "A busca requer pelo menos 4 caracteres." },
      { status: 400 }
    );
  }

  const apiKey = process.env.TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`;

  let data: { results: Record<string, unknown>[] };
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB responded with ${response.status}`);
    }
    data = await response.json();
  } catch {
    return NextResponse.json(
      { error: "Não foi possível buscar filmes. Tente novamente." },
      { status: 502 }
    );
  }

  const results = data.results.slice(0, 5).map((movie) => {
    const releaseDate = typeof movie.release_date === "string" ? movie.release_date : "";
    const year = releaseDate ? parseInt(releaseDate.split("-")[0], 10) || null : null;

    const posterPath = typeof movie.poster_path === "string" ? movie.poster_path : null;
    const posterUrl = posterPath
      ? `https://image.tmdb.org/t/p/w500${posterPath}`
      : null;

    return {
      tmdb_id: movie.id,
      title: movie.title,
      year,
      poster_url: posterUrl,
      genre_ids: movie.genre_ids,
    };
  });

  return NextResponse.json(results);
}
