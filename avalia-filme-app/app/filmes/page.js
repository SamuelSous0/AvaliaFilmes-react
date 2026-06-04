"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllFilmes, updateFilme } from "../../services/filmeApi";
import styles from "./filmes.module.css";

const initialForm = { rating: "", review: "" };

export default function FilmesPage() {
  const router = useRouter();
  const [filmes, setFilmes] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [avaliacaoAbertaId, setAvaliacaoAbertaId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const loadFilmes = async () => {
    try {
      setLoading(true);
      const data = await getAllFilmes();
      setFilmes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessage({ text: "Falha ao carregar filmes.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) {
      router.push("/login");
      return;
    }

    const carregar = async () => {
      await loadFilmes();
    };

    carregar();
  }, [router]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const abrirAvaliacao = (filme) => {
    setAvaliacaoAbertaId(filme.id);
    setForm({ rating: filme.rating != null ? String(filme.rating) : "", review: filme.review || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      <div className={styles.cartaoFilmes}>
        <div className={styles.cabecalho}>
          <div>
            <h2>Filmes</h2>
            <p className={styles.subtitulo}>Visualize filmes e adicione sua avaliação (nota e comentário).</p>
          </div>
        </div>

        {message.text && (
          <p className={`${styles.mensagem} ${message.type === "success" ? styles.sucesso : styles.erro}`}>
            {message.text}
          </p>
        )}

        <div className={styles.formulario}>
          <p className={styles.subtitulo}>Selecione um filme na lista à direita para avaliar.</p>
        </div>
      </div>

      <div className={styles.listaFilmes}>
        <div className={styles.listaHeader}>
          <h3>Lista de Filmes</h3>
          <span>{filmes.length} filme(s) encontrados</span>
        </div>

        {loading ? (
          <div className={styles.carregando}>Carregando filmes...</div>
        ) : filmes.length === 0 ? (
          <div className={styles.vazio}>Nenhum filme cadastrado ainda.</div>
        ) : (
          filmes.map((filme) => (
            <div key={filme.id} className={styles.cardFilme}>
              <div className={styles.cardFilmeTopo}>
                <div>
                  <p className={styles.cardFilmeTitulo}>{filme.title}</p>
                  <p className={styles.cardFilmeDetalhe}>
                    {filme.director} • {filme.year || "Ano não informado"}
                  </p>
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
