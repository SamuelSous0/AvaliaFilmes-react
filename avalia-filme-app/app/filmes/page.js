"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllFilmes, saveFilme, updateFilme, deleteFilme } from "../../services/filmeApi";
import styles from "./filmes.module.css";

const initialForm = {
  title: "",
  director: "",
  year: "",
  rating: "",
  review: "",
};

export default function FilmesPage() {
  const router = useRouter();
  const [filmes, setFilmes] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
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

  const handleEdit = (filme) => {
    setEditingId(filme.id);
    setForm({
      title: filme.title || "",
      director: filme.director || "",
      year: filme.year ? String(filme.year) : "",
      rating: filme.rating ? String(filme.rating) : "",
      review: filme.review || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setMessage({ text: "", type: "" });
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.director.trim()) {
      setMessage({ text: "Título e diretor são obrigatórios.", type: "error" });
      return;
    }

    if (form.year && isNaN(Number(form.year))) {
      setMessage({ text: "Ano deve ser um número válido.", type: "error" });
      return;
    }

    if (form.rating && (Number(form.rating) < 0 || Number(form.rating) > 10)) {
      setMessage({ text: "Avaliação deve ficar entre 0 e 10.", type: "error" });
      return;
    }

    const payload = {
      title: form.title.trim(),
      director: form.director.trim(),
      year: form.year ? Number(form.year) : null,
      rating: form.rating ? Number(form.rating) : null,
      review: form.review.trim(),
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateFilme(editingId, payload);
        setMessage({ text: "Filme atualizado com sucesso.", type: "success" });
      } else {
        await saveFilme(payload);
        setMessage({ text: "Filme cadastrado com sucesso.", type: "success" });
      }
      resetForm();
      loadFilmes();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao salvar o filme.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja remover este filme?")) return;

    try {
      await deleteFilme(id);
      setMessage({ text: "Filme excluído com sucesso.", type: "success" });
      loadFilmes();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao excluir o filme.", type: "error" });
    }
  };

  return (
    <div className={styles.containerFilmes}>
      <div className={styles.cartaoFilmes}>
        <div className={styles.cabecalho}>
          <div>
            <h2>{editingId ? "Editar Filme" : "Cadastrar Filme"}</h2>
            <p className={styles.subtitulo}>Gerencie seu acervo de filmes com título, diretor, ano e avaliação.</p>
          </div>
          {editingId && (
            <button className={styles.botaoCancelar} onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>

        <div className={styles.formulario}>
          <div className={styles.grupoFormulario}>
            <label>Título</label>
            <input
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Nome do filme"
            />
          </div>

          <div className={styles.grupoFormulario}>
            <label>Diretor</label>
            <input
              value={form.director}
              onChange={(e) => handleChange("director", e.target.value)}
              placeholder="Nome do diretor"
            />
          </div>

          <div className={styles.linhaFormulario}>
            <div className={styles.grupoFormulario}> 
              <label>Ano</label>
              <input
                value={form.year}
                onChange={(e) => handleChange("year", e.target.value)}
                placeholder="2024"
              />
            </div>
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
              placeholder="Observações sobre o filme"
            />
          </div>

          {message.text && (
            <p className={`${styles.mensagem} ${
              message.type === "success" ? styles.sucesso : styles.erro
            }`}>
              {message.text}
            </p>
          )}

          <div className={styles.acoes}>
            <button className={styles.botaoSalvar} onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : editingId ? "Atualizar filme" : "Cadastrar filme"}
            </button>
          </div>
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
                <button className={styles.botaoEditar} onClick={() => handleEdit(filme)}>
                  Editar
                </button>
                <button className={styles.botaoExcluir} onClick={() => handleDelete(filme.id)}>
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
