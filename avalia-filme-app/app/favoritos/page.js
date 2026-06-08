"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getFavoritosByUser, deleteFavorito } from "../../services/favoritoApi";
import styles from "./favoritos.module.css";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

async function buscarPoster(titulo) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
        titulo
      )}&language=pt-BR`
    );

    const data = await res.json();
    const poster = data.results?.[0]?.poster_path;

    return poster ? `https://image.tmdb.org/t/p/w200${poster}` : null;
  } catch {
    return null;
  }
}

export default function FavoritosPage() {
  const router = useRouter();

  const [favoritos, setFavoritos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [posters, setPosters] = useState({});
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [removendo, setRemovendo] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const exibirToast = (msg, tipo = "info") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);

    setToast({ msg, tipo });

    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const carregarFavoritos = useCallback(async (id) => {
    setLoading(true);

    try {
      const data = await getFavoritosByUser(id);
      const lista = Array.isArray(data) ? data : [];

      setFavoritos(lista);
      setFiltrados(lista);

      const postersMap = {};

      await Promise.all(
        lista.map(async (fav) => {
          const titulo = fav.filme?.titulo;

          if (titulo) {
            const posterUrl = await buscarPoster(titulo);

            if (posterUrl) {
              postersMap[fav.id] = posterUrl;
            }
          }
        })
      );

      setPosters(postersMap);
    } catch (err) {
      console.error("[Favoritos] Erro ao carregar:", err);
      exibirToast("Não foi possível carregar seus favoritos.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = localStorage.getItem("userId");

    if (!id) {
      router.push("/login");
      return;
    }

    carregarFavoritos(id);
  }, [router, carregarFavoritos]);

  useEffect(() => {
    const termo = busca.toLowerCase().trim();

    if (!termo) {
      setFiltrados(favoritos);
      return;
    }

    const resultado = favoritos.filter(({ filme }) => {
      const f = filme || {};

      return (
        f.titulo?.toLowerCase().includes(termo) ||
        f.genero?.toLowerCase().includes(termo) ||
        f.diretor?.toLowerCase().includes(termo)
      );
    });

    setFiltrados(resultado);
  }, [busca, favoritos]);

  const handleRemover = async (favId, tituloFilme) => {
    setRemovendo(favId);

    try {
      await deleteFavorito(favId);

      setFavoritos((prev) => prev.filter((f) => f.id !== favId));

      exibirToast(`"${tituloFilme}" removido dos favoritos.`, "info");
    } catch (err) {
      console.error("[Favoritos] Erro ao remover:", err);
      exibirToast("Erro ao remover favorito. Tente novamente.", "error");
    } finally {
      setRemovendo(null);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroGlowSecondary} aria-hidden="true" />

        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>AvaliaFilmes</p>
          <h1 className={styles.heroTitle}>Meus Favoritos</h1>
          <p className={styles.heroSubtitle}>
            Sua coleção pessoal dos filmes que mais marcaram sua experiência.
          </p>
        </div>

        <div className={styles.heroDivider} aria-hidden="true" />
      </section>

      <section className={styles.controls}>
        <div className={styles.controlsInner}>
          <div className={styles.counter}>
            {loading ? (
              <span className={styles.counterSkeleton} />
            ) : (
              <>
                <span className={styles.counterNumber}>{favoritos.length}</span>
                <span className={styles.counterLabel}>
                  {favoritos.length === 1
                    ? "filme favoritado"
                    : "filmes favoritados"}
                </span>
              </>
            )}
          </div>

          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon} aria-hidden="true">
              <SearchIcon />
            </span>

            <input
              className={styles.searchInput}
              type="search"
              placeholder="Pesquisar favoritos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Pesquisar entre seus filmes favoritos"
            />

            {busca && (
              <button
                className={styles.searchClear}
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      <main className={styles.main}>
        {loading && (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonPoster} />
                <div className={styles.skeletonBody}>
                  <div className={styles.skeletonLine} style={{ width: "40%" }} />
                  <div className={styles.skeletonLine} style={{ width: "80%" }} />
                  <div className={styles.skeletonLine} style={{ width: "55%" }} />
                  <div
                    className={styles.skeletonLine}
                    style={{ width: "90%", height: "48px" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && favoritos.length > 0 && filtrados.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h2 className={styles.emptyTitle}>Nenhum resultado para "{busca}"</h2>
            <p className={styles.emptyText}>
              Tente buscar por outro título, gênero ou diretor.
            </p>
            <button className={styles.btnSecondary} onClick={() => setBusca("")}>
              Limpar busca
            </button>
          </div>
        )}

        {!loading && favoritos.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎬</div>
            <h2 className={styles.emptyTitle}>Nenhum favorito encontrado</h2>
            <p className={styles.emptyText}>
              Adicione filmes aos favoritos na página de Filmes clicando na estrela.
            </p>
            <Link href="/filmes" className={styles.btnPrimary}>
              Explorar Filmes
            </Link>
          </div>
        )}

        {!loading && filtrados.length > 0 && (
          <div className={styles.grid}>
            {filtrados.map((fav, index) => (
              <MovieCard
                key={fav.id}
                fav={fav}
                index={index}
                posterUrl={posters[fav.id]}
                removendo={removendo === fav.id}
                onRemover={handleRemover}
              />
            ))}
          </div>
        )}
      </main>

      {toast && (
        <div
          className={`${styles.toast} ${styles[`toast${capitalize(toast.tipo)}`]}`}
          role="alert"
        >
          <span className={styles.toastIcon}>
            {toast.tipo === "error" ? "✕" : toast.tipo === "info" ? "ℹ" : "✓"}
          </span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function MovieCard({ fav, index, posterUrl, removendo, onRemover }) {
  const filme = fav.filme || {};
  const titulo = filme.titulo || "Sem título";

  return (
    <article
      className={`${styles.card} ${removendo ? styles.cardRemoving : ""}`}
      style={{ animationDelay: `${Math.min(index * 55, 440)}ms` }}
    >
      <div className={styles.cardPoster}>
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`Poster de ${titulo}`}
            className={styles.posterImg}
          />
        ) : (
          <div className={styles.posterPlaceholder}>
            <FilmIcon />
            <span>{titulo.charAt(0)}</span>
          </div>
        )}

        <div className={styles.favBadge}>⭐</div>

        {filme.genero && (
          <span className={styles.genreOverlay}>{filme.genero}</span>
        )}
      </div>

      <div className={styles.cardBody}>
        {filme.anoLancamento && (
          <span className={styles.year}>{filme.anoLancamento}</span>
        )}

        <h2 className={styles.cardTitle}>{titulo}</h2>

        {filme.diretor && (
          <p className={styles.cardDirector}>
            <span className={styles.directorLabel}>Dir.</span> {filme.diretor}
          </p>
        )}

        {filme.descricao && (
          <p className={styles.cardDescription}>{filme.descricao}</p>
        )}
      </div>

      <div className={styles.cardFooter}>
        <button
          className={styles.btnRemove}
          onClick={() => onRemover(fav.id, titulo)}
          disabled={removendo}
        >
          {removendo ? (
            <span className={styles.btnSpinner} />
          ) : (
            <>
              <TrashIcon />
              Remover
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}