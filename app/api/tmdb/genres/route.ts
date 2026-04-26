import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=pt-BR`;

  let data: { genres: { id: number; name: string }[] };
  try {
    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) {
      throw new Error(`TMDB responded with ${response.status}`);
    }
    data = await response.json();
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar gêneros." },
      { status: 502 }
    );
  }

  const NAME_MAP: Record<string, string> = {
    Thriller: 'Suspense',
  }

  return NextResponse.json(
    data.genres.map(g => ({ ...g, name: NAME_MAP[g.name] ?? g.name }))
  );
}
