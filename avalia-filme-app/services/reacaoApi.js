import axios from "axios";

const instance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

export async function avaliar(perfilId, reviewId, nota) {
  const response = await instance.post("/reacoes/avaliar", null, {
    params: { perfilId, reviewId, nota },
  });
  return response.data;
}

export async function removerAvaliacao(perfilId, reviewId) {
  const response = await instance.delete("/reacoes/remover", {
    params: { perfilId, reviewId },
  });
  return response.data;
}

export async function getAvaliacoesByReview(reviewId) {
  const response = await instance.get(`/reacoes/review/${reviewId}`);
  return response.data;
}

export async function getAvaliacoesByPerfil(perfilId) {
  const response = await instance.get(`/reacoes/perfil/${perfilId}`);
  return response.data;
}

export async function getMediaByReview(reviewId) {
  const response = await instance.get(`/reacoes/review/${reviewId}/media`);
  return response.data;
}