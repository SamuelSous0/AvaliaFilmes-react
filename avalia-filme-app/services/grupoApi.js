import axios from "axios";

const instance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

export async function getAllGrupos() {
  const response = await instance.get("/grupos/allGrupos");
  return response.data;
}

export async function getGrupoById(id) {
  const response = await instance.get(`/grupos/grupo/${id}`);
  return response.data;
}

export async function buscarGruposPorNome(nome) {
  const response = await instance.get("/grupos/buscar", { params: { nome } });
  return response.data;
}

export async function saveGrupo(grupo) {
  const response = await instance.post("/grupos/add", grupo);
  return response.data;
}

export async function updateGrupo(id, grupo) {
  const response = await instance.put(`/grupos/update/${id}`, grupo);
  return response.data;
}

export async function deleteGrupo(id) {
  const response = await instance.delete(`/grupos/grupo/${id}`);
  return response.data;
}

export async function adicionarMembro(grupoId, perfilId) {
  const response = await instance.post(`/grupos/${grupoId}/membros/${perfilId}`);
  return response.data;
}

export async function removerMembro(grupoId, perfilId) {
  const response = await instance.delete(`/grupos/${grupoId}/membros/${perfilId}`);
  return response.data;
}

export async function adicionarFilme(grupoId, filmeId) {
  const response = await instance.post(`/grupos/${grupoId}/filmes/${filmeId}`);
  return response.data;
}

export async function removerFilme(grupoId, filmeId) {
  const response = await instance.delete(`/grupos/${grupoId}/filmes/${filmeId}`);
  return response.data;
}