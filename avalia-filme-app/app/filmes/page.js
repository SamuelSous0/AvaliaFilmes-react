"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllFilmes } from "../../services/filmeApi";
import { getAllPerfis, savePerfil } from "../../services/perfilApi";
import { getUserById } from "../../services/userApi";
import {
  deleteReview,
  getAllReviews,
  saveReview,
  updateReview,
} from "../../services/reviewApi";
import styles from "./filmes.module.css";

import {
  getFavoritosByUser,
  addFavorito,
  deleteFavorito,
} from "../../services/favoritoApi";

const initialForm = { rating: "", review: "" };
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

async function buscarPoster(titulo) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(titulo)}&language=pt-BR`,
    );
    const data = await res.json();
    const poster = data.results?.[0]?.poster_path;
    return poster ? `https://image.tmdb.org/t/p/w200${poster}` : null;
  } catch {
    return null;
  }
}

const aguardar = (tempoEmMs) =>
  new Promise((resolve) => setTimeout(resolve, tempoEmMs));

const encontrarPerfilDoUsuario = (perfis, nomeUsuario, userId) => {
  if (!Array.isArray(perfis)) return null;

  return perfis.find((perfil) => {
    const perfilUserId =
      perfil.userId ??
      perfil.user?.id ??
      perfil.usuarioId ??
      perfil.usuario?.id;
    const perfilUsername =
      perfil.username ?? perfil.user?.username ?? perfil.usuario?.username;

    return (
      (userId && Number(perfilUserId) === Number(userId)) ||
      (nomeUsuario && perfilUsername === nomeUsuario)
    );
  });
};

const obterReviewFilmeId = (review) =>
  review.filmeId ??
  review.filme?.id ??
  review.filme_id ??
  review.movieId ??
  null;

const obterPerfilReviewId = (review) =>
  review.perfilId ?? review.perfil?.id ?? review.perfil_id ?? null;

const formatarNota = (nota) => {
  const numero = Number(nota);
  return Number.isFinite(numero) ? numero.toFixed(1) : "—";
};

export default function FilmesPage() {
  const router = useRouter();
  const [filmes, setFilmes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busca, setBusca] = useState("");
  const [posters, setPosters] = useState({});
  const [form, setForm] = useState(initialForm);
  const [avaliacaoAbertaId, setAvaliacaoAbertaId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [userId, setUserId] = useState(null);
  const [perfilId, setPerfilId] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [favoritandoId, setFavoritandoId] = useState(null);
  const [removingAvaliacaoId, setRemovingAvaliacaoId] = useState(null);
  const criandoPerfilRef = useRef(false);

  const carregarPerfilLogado = useCallback(async (id, username) => {
    const [perfisData, userData] = await Promise.all([
      getAllPerfis(),
      getUserById(id).catch(() => null),
    ]);

    const nomeUsuario = userData?.name || userData?.username || username;
    let perfilLogado = encontrarPerfilDoUsuario(perfisData, nomeUsuario, id);

    if (!perfilLogado?.id) {
      try {
        if (criandoPerfilRef.current) {
          await aguardar(500);
        } else {
          criandoPerfilRef.current = true;
          perfilLogado = await savePerfil({
            userId: Number(id),
            biografia: "",
            fotoUrl: "",
          });
        }
      } catch (error) {
        console.error("Erro ao criar perfil inicial:", error);
      } finally {
        criandoPerfilRef.current = false;
      }

      if (!perfilLogado?.id) {
        const perfisAtualizados = await getAllPerfis();
        perfilLogado = encontrarPerfilDoUsuario(
          perfisAtualizados,
          nomeUsuario,
          id,
        );
      }
    }

    if (perfilLogado?.id) {
      localStorage.setItem("perfilId", perfilLogado.id);
    }

    setPerfilId(perfilLogado?.id || null);
    return perfilLogado?.id || null;
  }, []);

  const loadFavoritos = async (id) => {
    try {
      const data = await getFavoritosByUser(id);
      setFavoritos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar favoritos:", error);
    }
  };

  const loadFilmes = useCallback(async () => {
    try {
      setLoading(true);

      const id = localStorage.getItem("userId");
      const username = localStorage.getItem("username");

      if (!id) {
        router.push("/login");
        return;
      }

      setUserId(id);

      const [filmesData, reviewsData] = await Promise.all([
        getAllFilmes(),
        getAllReviews(),
      ]);

      const lista = Array.isArray(filmesData) ? filmesData : [];
      setFilmes(lista);
      setFiltrados(lista);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);

      await Promise.all([
        carregarPerfilLogado(id, username),
        loadFavoritos(id),
      ]);

      const postersMap = {};
      await Promise.all(
        lista.map(async (filme) => {
          const titulo = filme.titulo || filme.title || filme.name || "";
          const url = titulo ? await buscarPoster(titulo) : null;
          if (url) postersMap[filme.id] = url;
        }),
      );
      setPosters(postersMap);
    } catch (error) {
      console.error(error);
      setMessage({ text: "Falha ao carregar filmes.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [carregarPerfilLogado, router]);

  const minhasReviewsPorFilme = useMemo(() => {
    const mapa = new Map();

    reviews.forEach((review) => {
      const reviewPerfilId = obterPerfilReviewId(review);
      const reviewFilmeId = obterReviewFilmeId(review);

      if (
        Number(reviewPerfilId) === Number(perfilId) &&
        reviewFilmeId != null
      ) {
        mapa.set(Number(reviewFilmeId), review);
      }
    });

    return mapa;
  }, [reviews, perfilId]);

  const verificarFavorito = (filmeId) => {
    return favoritos.find((fav) => fav.filme?.id === filmeId);
  };

  const handleFavorito = async (filme) => {
    if (!userId) return;

    const favoritoExistente = verificarFavorito(filme.id);

    try {
      setFavoritandoId(filme.id);

      if (favoritoExistente) {
        await deleteFavorito(favoritoExistente.id);
        setMessage({ text: "Filme removido dos favoritos.", type: "success" });
      } else {
        await addFavorito(userId, filme.id);
        setMessage({
          text: "Filme adicionado aos favoritos.",
          type: "success",
        });
      }

      await loadFavoritos(userId);
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao atualizar favorito.", type: "error" });
    } finally {
      setFavoritandoId(null);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFilmes();
  }, [loadFilmes]);

  useEffect(() => {
    if (!busca.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFiltrados(filmes);
    } else {
      setFiltrados(
        filmes.filter(
          (f) =>
            (f.titulo || f.title || "")
              .toLowerCase()
              .includes(busca.toLowerCase()) ||
            (f.diretor || f.director || "")
              .toLowerCase()
              .includes(busca.toLowerCase()) ||
            (f.genero || "").toLowerCase().includes(busca.toLowerCase()),
        ),
      );
    }
  }, [busca, filmes]);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const abrirAvaliacao = (filme) => {
    const minhaReview = minhasReviewsPorFilme.get(Number(filme.id));

    setAvaliacaoAbertaId(filme.id);
    setForm({
      rating: minhaReview?.nota != null ? String(minhaReview.nota) : "",
      review: minhaReview?.comentario || "",
    });
    setMessage({ text: "", type: "" });
  };

  const cancelarAvaliacao = () => {
    setAvaliacaoAbertaId(null);
    setForm(initialForm);
    setMessage({ text: "", type: "" });
  };

  const validarAvaliacao = () => {
    const nota = Number(form.rating);

    if (!perfilId) {
      return "Não foi possível identificar seu perfil. Atualize a página e tente novamente.";
    }

    if (Number.isNaN(nota) || nota < 0 || nota > 5) {
      return "Avaliação deve ficar entre 0 e 5.";
    }

    if (!form.review.trim()) {
      return "Escreva um comentário para publicar sua review.";
    }

    return null;
  };

  const handleSalvarAvaliacao = async (filme) => {
    const erro = validarAvaliacao();
    if (erro) {
      setMessage({ text: erro, type: "error" });
      return;
    }

    const reviewExistente = minhasReviewsPorFilme.get(Number(filme.id));

    try {
      setSaving(true);

      const payload = {
        filmeId: Number(filme.id),
        perfilId: Number(perfilId),
        nota: Number(form.rating),
        comentario: form.review.trim(),
      };

      if (reviewExistente?.id) {
        await updateReview(reviewExistente.id, payload);
      } else {
        await saveReview(payload);
      }

      setMessage({
        text: "Avaliação salva e enviada para suas reviews.",
        type: "success",
      });
      setAvaliacaoAbertaId(null);
      setForm(initialForm);
      await loadFilmes();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao salvar avaliação.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoverAvaliacao = async (filme) => {
    const reviewExistente = minhasReviewsPorFilme.get(Number(filme.id));

    if (!reviewExistente?.id) {
      setMessage({
        text: "Nenhuma avaliação encontrada para remover.",
        type: "error",
      });
      return;
    }

    try {
      setRemovingAvaliacaoId(filme.id);
      await deleteReview(reviewExistente.id);
      setMessage({
        text: "Avaliação removida das suas reviews.",
        type: "success",
      });

      if (avaliacaoAbertaId === filme.id) {
        setAvaliacaoAbertaId(null);
        setForm(initialForm);
      }

      await loadFilmes();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao remover avaliação.", type: "error" });
    } finally {
      setRemovingAvaliacaoId(null);
    }
  };

  return (
    <div className={styles.containerFilmes}>
      <div className={styles.cartaoFilmes}>
        <div className={styles.cabecalho}>
          <div>
            <h2>Filmes</h2>
            <p className={styles.subtitulo}>
              Visualize filmes, busque, marque favoritos e publique reviews com
              nota de 0 a 5.
            </p>
          </div>
        </div>

        {message.text && (
          <p
            className={`${styles.mensagem} ${message.type === "success" ? styles.sucesso : styles.erro}`}
          >
            {message.text}
          </p>
        )}

        <div className={styles.formulario}>
          <p className={styles.subtitulo}>
            Selecione um filme abaixo para avaliar.
          </p>
        </div>
      </div>

      <div className={styles.listaFilmes}>
        <div className={styles.listaHeader}>
          <h3>Lista de Filmes</h3>
          <span>{filtrados.length} filme(s) encontrados</span>
        </div>

        <input
          placeholder="Buscar por título, diretor ou gênero..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "12px",
            backgroundColor: "#2a2a2a",
            border: "1px solid #444",
            borderRadius: "6px",
            color: "white",
            fontSize: "14px",
          }}
        />

        {loading ? (
          <div className={styles.carregando}>Carregando filmes...</div>
        ) : filtrados.length === 0 ? (
          <div className={styles.vazio}>Nenhum filme encontrado.</div>
        ) : (
          filtrados.map((filme) => {
            const minhaReview = minhasReviewsPorFilme.get(Number(filme.id));
            const cover =
              posters[filme.id] ||
              filme.coverUrl ||
              filme.posterUrl ||
              filme.capa ||
              filme.image ||
              filme.poster ||
              filme.imagem;
            return (
              <div key={filme.id} className={styles.cardFilme}>
                <button
                  className={`${styles.botaoFavorito} ${verificarFavorito(filme.id) ? styles.favoritado : ""}`}
                  onClick={() => handleFavorito(filme)}
                  disabled={favoritandoId === filme.id}
                  title={
                    verificarFavorito(filme.id)
                      ? "Remover dos favoritos"
                      : "Adicionar aos favoritos"
                  }
                >
                  {favoritandoId === filme.id
                    ? "..."
                    : verificarFavorito(filme.id)
                      ? "★"
                      : "☆"}
                </button>

                <div className={styles.cardFilmeTopo}>
                  <div className={styles.capaContainer}>
                    {cover ? (
                      <img
                        src={cover}
                        alt={filme.titulo || filme.title}
                        className={styles.capaImagem}
                      />
                    ) : (
                      <div className={styles.capaPlaceholder} />
                    )}
                  </div>

                  <div className={styles.cardFilmeInfo}>
                    <p className={styles.cardFilmeTitulo}>
                      {filme.titulo || filme.title}
                    </p>
                    <p className={styles.cardFilmeDetalhe}>
                      {(filme.diretor || filme.director) +
                        " • " +
                        (filme.anoLancamento ||
                          filme.year ||
                          "Ano não informado")}
                    </p>
                    {filme.genero && (
                      <p className={styles.cardFilmeDetalhe}>{filme.genero}</p>
                    )}
                    {minhaReview && (
                      <p className={styles.cardFilmeDetalhe}>
                        Sua review: {formatarNota(minhaReview.nota)}/5.0
                      </p>
                    )}
                  </div>

                  <div className={styles.cardFilmeNota}>
                    {minhaReview
                      ? `${formatarNota(minhaReview.nota)}/5.0`
                      : "—"}
                  </div>
                </div>

                {minhaReview?.comentario && (
                  <p className={styles.cardFilmeDescricao}>
                    {minhaReview.comentario}
                  </p>
                )}

                <div className={styles.cardFilmeAcoes}>
                  <button
                    className={styles.botaoEditar}
                    onClick={() => abrirAvaliacao(filme)}
                  >
                    {minhaReview ? "Editar avaliação" : "Avaliar"}
                  </button>
                  {minhaReview && (
                    <button
                      className={styles.botaoCancelar}
                      onClick={() => handleRemoverAvaliacao(filme)}
                      disabled={removingAvaliacaoId === filme.id}
                    >
                      {removingAvaliacaoId === filme.id
                        ? "Removendo..."
                        : "Remover avaliação"}
                    </button>
                  )}
                </div>

                {avaliacaoAbertaId === filme.id && (
                  <div className={styles.formulario} style={{ marginTop: 12 }}>
                    <div className={styles.linhaFormulario}>
                      <div className={styles.grupoFormulario}>
                        <label>Avaliação</label>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.5"
                          value={form.rating}
                          onChange={(e) =>
                            handleChange("rating", e.target.value)
                          }
                          placeholder="0 a 5"
                        />
                      </div>
                    </div>
                    <div className={styles.grupoFormulario}>
                      <label>Comentário</label>
                      <textarea
                        value={form.review}
                        onChange={(e) => handleChange("review", e.target.value)}
                        placeholder="Seu comentário sobre o filme"
                      />
                    </div>
                    <div className={styles.acoes}>
                      <button
                        className={styles.botaoSalvar}
                        onClick={() => handleSalvarAvaliacao(filme)}
                        disabled={saving}
                      >
                        {saving ? "Salvando..." : "Salvar avaliação"}
                      </button>
                      <button
                        className={styles.botaoCancelar}
                        onClick={cancelarAvaliacao}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
