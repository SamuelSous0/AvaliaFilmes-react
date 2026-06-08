import axios from "axios";

const instance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

export async function getFavoritosByUser(userId) {
  const response = await instance.get(`/favoritos/user/${userId}`);
  return response.data;
}

export async function addFavorito(userId, filmeId) {
  const response = await instance.post(
    `/favoritos/add?userId=${userId}&filmeId=${filmeId}`
  );
  return response.data;
}

export async function deleteFavorito(id) {
  const response = await instance.delete(`/favoritos/${id}`);
  return response.data;
}