"use client";
import { useEffect, useState } from "react";
import { avaliar, removerAvaliacao, getMediaByReview, getAvaliacoesByPerfil } from "../../../services/reacaoApi";
import styles from "./ReacaoEstrelas.module.css";

export default function ReacaoEstrelas({ reviewId }) {
  const [media, setMedia] = useState(0);
  const [notaUsuario, setNotaUsuario] = useState(null);
  const [hover, setHover] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [perfilId, setPerfilId] = useState(null);

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    const buscarPerfil = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/perfis/all`
        );
        const perfis = await res.json();
        const username = localStorage.getItem("username");
        const meuPerfil = perfis.find((p) => p.username === username);
        if (meuPerfil) setPerfilId(meuPerfil.id);
      } catch (error) {
        console.error(error);
      }
    };

    if (userId) buscarPerfil();
  }, [userId]);

  const loadDados = async () => {
    try {
      const mediaData = await getMediaByReview(reviewId);
      setMedia(mediaData || 0);

      if (perfilId) {
        try {
          const avaliacoes = await getAvaliacoesByPerfil(perfilId);
          const minhaAvaliacao = avaliacoes.find(
            (a) => a.review?.id === reviewId
          );
          setNotaUsuario(minhaAvaliacao ? minhaAvaliacao.nota : null);
        } catch {
          
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (reviewId) loadDados();
  }, [reviewId, perfilId]);

  const handleAvaliar = async (nota) => {
    if (!perfilId) {
      setMessage({ text: "Faça login para avaliar.", type: "error" });
      return;
    }
    try {
      setSaving(true);
      await avaliar(Number(perfilId), reviewId, nota);
      setNotaUsuario(nota);
      setMessage({ text: "Avaliação salva!", type: "success" });
      loadDados();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao salvar avaliação.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemover = async () => {
    if (!perfilId) return;
    try {
      setSaving(true);
      await removerAvaliacao(Number(perfilId), reviewId);
      setNotaUsuario(null);
      setMessage({ text: "Avaliação removida.", type: "success" });
      loadDados();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao remover avaliação.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>

      <div className={styles.mediaLinha}>
        <span className={styles.mediaLabel}>Média:</span>
        <div className={styles.estrelas}>
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={i < Math.round(media) ? styles.estrelaAtiva : styles.estrelaVazia}
            >
              ★
            </span>
          ))}
        </div>
        <span className={styles.mediaValor}>
          {media > 0 ? media.toFixed(1) : "—"}
        </span>
      </div>

      <div className={styles.avaliarLinha}>
        <span className={styles.avaliarLabel}>
          {notaUsuario ? "Sua nota:" : "Avaliar:"}
        </span>
        <div className={styles.estrelas}>
          {Array.from({ length: 5 }, (_, i) => {
            const valor = i + 1;
            const ativo = hover !== null ? valor <= hover : valor <= notaUsuario;
            return (
              <span
                key={i}
                className={ativo ? styles.estrelaAtiva : styles.estrelaVazia}
                onMouseEnter={() => setHover(valor)}
                onMouseLeave={() => setHover(null)}
                onClick={() => !saving && handleAvaliar(valor)}
                style={{ cursor: saving ? "not-allowed" : "pointer" }}
              >
                ★
              </span>
            );
          })}
        </div>
        {notaUsuario && (
          <button
            className={styles.botaoRemover}
            onClick={handleRemover}
            disabled={saving}
          >
            Remover
          </button>
        )}
      </div>

      {message.text && (
        <p className={`${styles.mensagem} ${message.type === "success" ? styles.sucesso : styles.erro}`}>
          {message.text}
        </p>
      )}

    </div>
  );
}