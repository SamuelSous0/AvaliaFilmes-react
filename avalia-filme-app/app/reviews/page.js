"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import FilmePoster from "../components/FilmePoster/FilmePoster";
import ReacaoEstrelas from "../components/ReacaoEstrelas/ReacaoEstrelas";
import { getAllFilmes } from "../../services/filmeApi";
import { getAllPerfis } from "../../services/perfilApi";
import { deleteReview, getAllReviews, saveReview } from "../../services/reviewApi";
import styles from "./reviews.module.css";

const initialForm = {
  filmeId: "",
  nota: "",
  comentario: "",
};

export default function ReviewsPage() {
  const router = useRouter();
  const [perfilId, setPerfilId] = useState(null);
  const [filmes, setFilmes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);

      const username = localStorage.getItem("username");
      const userId = localStorage.getItem("userId");

      if (!userId || !username) {
        router.push("/login");
        return;
      }

      const [reviewsData, filmesData, perfisData] = await Promise.all([
        getAllReviews(),
        getAllFilmes(),
        getAllPerfis(),
      ]);

      const perfilLogado = Array.isArray(perfisData)
        ? perfisData.find((perfil) => perfil.username === username || perfil.user?.username === username)
        : null;

      if (!perfilLogado?.id) {
        setMessage({
          text: "Não encontramos um perfil vinculado ao seu usuário. Crie/complete seu perfil antes de publicar reviews.",
          type: "error",
        });
      }

      setPerfilId(perfilLogado?.id || null);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      setFilmes(Array.isArray(filmesData) ? filmesData : []);
    } catch (error) {
      console.error(error);
      setMessage({ text: "Não foi possível carregar as reviews.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarDados();
  }, [carregarDados]);

  const minhasReviews = useMemo(
    () => reviews.filter((review) => Number(review.perfilId) === Number(perfilId)),
    [reviews, perfilId]
  );

  const reviewsDeOutros = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return reviews
      .filter((review) => Number(review.perfilId) !== Number(perfilId))
      .filter((review) => {
        if (!termo) return true;

        return (
          review.filmeTitulo?.toLowerCase().includes(termo) ||
          review.perfilNome?.toLowerCase().includes(termo) ||
          review.comentario?.toLowerCase().includes(termo)
        );
      });
  }, [reviews, perfilId, busca]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validarFormulario = () => {
    const nota = Number(form.nota);

    if (!perfilId) {
      return "Você precisa ter um perfil para criar uma review.";
    }

    if (!form.filmeId) {
      return "Selecione um filme para criar a review.";
    }

    if (Number.isNaN(nota) || nota < 0 || nota > 10) {
      return "A nota deve ser um número entre 0 e 10.";
    }

    if (!form.comentario.trim()) {
      return "Escreva um comentário para publicar sua review.";
    }

    return null;
  };

  const handleSalvarReview = async (event) => {
    event.preventDefault();
    setMessage({ text: "", type: "" });

    const erro = validarFormulario();
    if (erro) {
      setMessage({ text: erro, type: "error" });
      return;
    }

    try {
      setSaving(true);

      await saveReview({
        filmeId: Number(form.filmeId),
        perfilId: Number(perfilId),
        nota: Number(form.nota),
        comentario: form.comentario.trim(),
      });

      setMessage({ text: "Review publicada com sucesso!", type: "success" });
      setForm(initialForm);
      setShowForm(false);
      await carregarDados();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao publicar review. Tente novamente.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoverReview = async (reviewId) => {
    try {
      setRemovingId(reviewId);
      await deleteReview(reviewId);
      setMessage({ text: "Review removida com sucesso.", type: "success" });
      await carregarDados();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao remover review.", type: "error" });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>AvaliaFilmes</p>
          <h1>Reviews</h1>
          <p className={styles.subtitle}>
            Publique suas opiniões e acompanhe o que outros usuários estão falando sobre seus filmes favoritos.
          </p>
        </div>

        <motion.button
          className={styles.primaryButton}
          onClick={() => setShowForm((prev) => !prev)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          disabled={!perfilId}
        >
          {showForm ? "Fechar formulário" : "+ Nova review"}
        </motion.button>
      </section>

      {message.text && (
        <p className={`${styles.message} ${message.type === "success" ? styles.success : styles.error}`}>
          {message.text}
        </p>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.form
            className={styles.formCard}
            onSubmit={handleSalvarReview}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <div className={styles.formHeader}>
              <h2>Criar nova review</h2>
              <span>Nota de 0 a 10</span>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                Filme
                <select value={form.filmeId} onChange={(event) => handleChange("filmeId", event.target.value)}>
                  <option value="">Selecione um filme</option>
                  {filmes.map((filme) => (
                    <option key={filme.id} value={filme.id}>
                      {filme.titulo || filme.title || `Filme #${filme.id}`}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                Nota
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  placeholder="Ex.: 8.5"
                  value={form.nota}
                  onChange={(event) => handleChange("nota", event.target.value)}
                />
              </label>
            </div>

            <label className={styles.field}>
              Comentário
              <textarea
                rows="5"
                maxLength="1000"
                placeholder="Conte o que achou do filme..."
                value={form.comentario}
                onChange={(event) => handleChange("comentario", event.target.value)}
              />
            </label>

            <div className={styles.formActions}>
              <button className={styles.primaryButton} type="submit" disabled={saving}>
                {saving ? "Publicando..." : "Publicar review"}
              </button>
              <button className={styles.secondaryButton} type="button" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <section className={styles.columns}>
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Sua área</p>
              <h2>Minhas reviews</h2>
            </div>
            <span className={styles.counter}>{minhasReviews.length}</span>
          </div>

          {loading ? (
            <ReviewSkeleton />
          ) : minhasReviews.length === 0 ? (
            <EmptyState icon="✍️" title="Você ainda não publicou reviews" text="Clique em Nova review para registrar sua primeira opinião." />
          ) : (
            <div className={styles.reviewList}>
              {minhasReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  isMine
                  removing={removingId === review.id}
                  onRemove={() => handleRemoverReview(review.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Comunidade</p>
              <h2>Reviews de outros usuários</h2>
            </div>
            <span className={styles.counter}>{reviewsDeOutros.length}</span>
          </div>

          <input
            className={styles.searchInput}
            type="search"
            placeholder="Buscar por filme, usuário ou comentário..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />

          {loading ? (
            <ReviewSkeleton />
          ) : reviewsDeOutros.length === 0 ? (
            <EmptyState icon="🎬" title="Nenhuma review encontrada" text="Quando outros usuários publicarem, elas aparecerão aqui." />
          ) : (
            <div className={styles.reviewList}>
              {reviewsDeOutros.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ReviewCard({ review, isMine = false, removing = false, onRemove }) {
  return (
    <motion.article className={styles.reviewCard} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className={styles.posterBox}>
        <FilmePoster titulo={review.filmeTitulo} />
      </div>

      <div className={styles.reviewContent}>
        <div className={styles.reviewTopline}>
          <span className={styles.badge}>{isMine ? "Minha review" : review.perfilNome || "Usuário"}</span>
          <span className={styles.date}>{formatDate(review.dataCriacao)}</span>
        </div>

        <h3>{review.filmeTitulo || "Filme sem título"}</h3>

        <div className={styles.ratingLine} aria-label={`Nota ${review.nota} de 10`}>
          <span className={styles.ratingStars}>{renderStars(review.nota)}</span>
          <strong>{Number(review.nota).toFixed(1)}/10</strong>
        </div>

        <p className={styles.comment}>{review.comentario}</p>

        {!isMine && <ReacaoEstrelas reviewId={review.id} />}

        {isMine && (
          <button className={styles.dangerButton} onClick={onRemove} disabled={removing}>
            {removing ? "Removendo..." : "Remover review"}
          </button>
        )}
      </div>
    </motion.article>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div className={styles.emptyState}>
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className={styles.skeletonList}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div className={styles.skeletonCard} key={index}>
          <div className={styles.skeletonPoster} />
          <div className={styles.skeletonBody}>
            <span />
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(date) {
  if (!date) return "Agora";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function renderStars(nota = 0) {
  const stars = Math.round(Number(nota) / 2);
  return "★".repeat(stars).padEnd(5, "☆");
}
