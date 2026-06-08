import axios from "axios";

const instance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

export async function getPerfilById(id) {
  const response = await instance.get(`/perfis/${id}`);
  return response.data;
}

export async function getAllPerfis() {
  const response = await instance.get("/perfis/all");
  return response.data;
}

export async function savePerfil(perfilData) {
  const response = await instance.post("/perfis/add", perfilData);
  return response.data;
}

export async function deletePerfil(id) {
  const response = await instance.delete(`/perfis/${id}`);
  return response.data;
}

export async function updatePerfil(id, perfilData) {
  const response = await instance.put(`/perfis/${id}`, perfilData);
  return response.data;
}