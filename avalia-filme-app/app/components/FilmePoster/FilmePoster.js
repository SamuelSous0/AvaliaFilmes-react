"use client";
import useSWR from "swr";
import styles from "./FilmePoster.module.css";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

const posterFetcher = async (titulo) => {
  if (!TMDB_KEY || !titulo) return null;
  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(titulo)}&language=pt-BR`
  );
  const data = await res.json();
  const poster = data.results?.[0]?.poster_path;
  return poster ? `https://image.tmdb.org/t/p/w200${poster}` : null;
};

export default function FilmePoster({ titulo, className }) {
  const { data: posterUrl } = useSWR(
    titulo ? `poster:${titulo}` : null,
    () => posterFetcher(titulo),
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  if (!posterUrl) {
    return (
      <div className={`${styles.placeholder} ${className || ""}`}>
        🎬
      </div>
    );
  }

  return (
    <img
      src={posterUrl}
      alt={titulo}
      className={`${styles.poster} ${className || ""}`}
      onError={(e) => { e.target.style.display = "none"; }}
    />
  );
}