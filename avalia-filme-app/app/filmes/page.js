"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllFilmes, updateFilme } from "../../services/filmeApi";
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
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(titulo)}&language=pt-BR`
    );
    const data = await res.json();
    const poster = data.results?.[0]?.poster_path;
    return poster ? `https://image.tmdb.org/t/p/w200${poster}` : null;
  } catch {
    return null;
  }
}

export default function FilmesPage() {
  const router = useRouter();
  const [filmes, setFilmes] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busca, setBusca] = useState("");
  const [posters, setPosters] = useState({});
  const [form, setForm] = useState(initialForm);
  const [avaliacaoAbertaId, setAvaliacaoAbertaId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [userId, setUserId] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [favoritandoId, setFavoritandoId] = useState(null);

  const loadFilmes = async () => {
    try {
      setLoading(true);
      const data = await getAllFilmes();
      const lista = Array.isArray(data) ? data : [];
      setFilmes(lista);
      setFiltrados(lista);

      const postersMap = {};
      await Promise.all(
        lista.map(async (filme) => {
          const url = await buscarPoster(filme.titulo);
          if (url) postersMap[filme.id] = url;
        })
      );
      setPosters(postersMap);
    } catch (error) {
      console.error(error);
      setMessage({ text: "Falha ao carregar filmes.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

    const loadFavoritos = async (id) => {
  try {
    const data = await getFavoritosByUser(id);
    setFavoritos(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Erro ao carregar favoritos:", error);
  }
};

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
      setMessage({ text: "Filme adicionado aos favoritos.", type: "success" });
    }

    await loadFavoritos(userId);
  } catch (error) {
    console.error(error);
    setMessage({
      text: "Erro ao atualizar favorito.",
      type: "error",
    });
  } finally {
    setFavoritandoId(null);
  }
};

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) { router.push("/login"); return; }

    setUserId(id);
    loadFilmes();
    loadFavoritos(id)
  }, [router]);

  useEffect(() => {
    if (!busca.trim()) {
      setFiltrados(filmes);
    } else {
      setFiltrados(filmes.filter(f =>
        f.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
        f.diretor?.toLowerCase().includes(busca.toLowerCase()) ||
        f.genero?.toLowerCase().includes(busca.toLowerCase())
      ));
    }
  }, [busca, filmes]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const abrirAvaliacao = (filme) => {
    setAvaliacaoAbertaId(filme.id);
    setForm({ rating: filme.rating != null ? String(filme.rating) : "", review: filme.review || "" });
  };

  const cancelarAvaliacao = () => {
    setAvaliacaoAbertaId(null);
    setForm(initialForm);
    setMessage({ text: "", type: "" });
  };

  const handleSalvarAvaliacao = async (id) => {
    if (form.rating && (isNaN(Number(form.rating)) || Number(form.rating) < 0 || Number(form.rating) > 10)) {
      setMessage({ text: "Avaliação deve ficar entre 0 e 10.", type: "error" });
      return;
    }
    const payload = {
      rating: form.rating ? Number(form.rating) : null,
      review: form.review ? form.review.trim() : "",
    };
    try {
      setSaving(true);
      await updateFilme(id, payload);
      setMessage({ text: "Avaliação salva com sucesso.", type: "success" });
      cancelarAvaliacao();
      loadFilmes();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao salvar avaliação.", type: "error" });
    } finally {
      setSaving(false);
    }
    
  };

  return (
    <div className={styles.containerFilmes}>
      <div className={styles.listaFilmes}>
        <div className={styles.listaHeader}>
          <h3>Lista de Filmes</h3>
          <span>{filtrados.length} filme(s) encontrados</span>
        </div>

        <input
          placeholder="Buscar por título, diretor ou gênero..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "12px",
            backgroundColor: "#2a2a2a",
            border: "1px solid #444",
            borderRadius: "6px",
            color: "white",
            fontSize: "14px"
          }}
        />

        {message.text && (
          <p className={`${styles.mensagem} ${message.type === "success" ? styles.sucesso : styles.erro}`}>
            {message.text}
          </p>
        )}

        {loading ? (
          <div className={styles.carregando}>Carregando filmes...</div>
        ) : filtrados.length === 0 ? (
          <div className={styles.vazio}>Nenhum filme encontrado.</div>
        ) : (
          filtrados.map((filme) => (
            <div key={filme.id} className={styles.cardFilme}>
              <button
               className={`${styles.botaoFavorito} ${
                verificarFavorito(filme.id) ? styles.favoritado : ""
              }`}
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
                {posters[filme.id] && (
                  <img
                    src={posters[filme.id]}
                    alt={filme.titulo}
                    style={{ width: 60, borderRadius: 6, marginRight: 12, objectFit: "cover" }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <p className={styles.cardFilmeTitulo}>{filme.titulo}</p>
                  <p className={styles.cardFilmeDetalhe}>
                    {filme.diretor} • {filme.anoLancamento}
                  </p>
                  <p className={styles.cardFilmeDetalhe}>{filme.genero}</p>
                </div>
                <div className={styles.cardFilmeNota}>
                  {filme.rating != null ? `${filme.rating}/10` : "—"}
                </div>
              </div>

              {filme.review && <p className={styles.cardFilmeDescricao}>{filme.review}</p>}

              <div className={styles.cardFilmeAcoes}>
                <button className={styles.botaoEditar} onClick={() => abrirAvaliacao(filme)}>
                  {filme.rating != null ? "Editar avaliação" : "Avaliar"}
                </button>
              </div>

              {avaliacaoAbertaId === filme.id && (
                <div className={styles.formulario} style={{ marginTop: 12 }}>
                  <div className={styles.linhaFormulario}>
                    <div className={styles.grupoFormulario}>
                      <label>Avaliação</label>
                      <input
                        value={form.rating}
                        onChange={(e) => handleChange("rating", e.target.value)}
                        placeholder="0 a 10"
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
                    <button className={styles.botaoSalvar} onClick={() => handleSalvarAvaliacao(filme.id)} disabled={saving}>
                      {saving ? "Salvando..." : "Salvar avaliação"}
                    </button>
                    <button className={styles.botaoCancelar} onClick={cancelarAvaliacao}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}