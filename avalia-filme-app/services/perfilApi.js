import axios from "axios";

const instance = axios.create({
  baseURL:
    "https://fuzzy-space-carnival-g47j9w6qqprv3vxxp-8080.app.github.dev/api/v1",
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
