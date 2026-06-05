import axios from "axios";

const instance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

export async function getAllFilmes() {
  const response = await instance.get("/filmes/allFilmes");
  return response.data;
}

export async function getFilmeById(id) {
  const response = await instance.get(`/filmes/${id}`);
  return response.data;
}

export async function saveFilme(filme) {
  const response = await instance.post("/filmes/add", filme);
  return response.data;
}

export async function updateFilme(id, filme) {
  const response = await instance.put(`/filmes/update/${id}`, filme);
  return response.data;
}

export async function deleteFilme(id) {
  const response = await instance.delete(`/filmes/${id}`);
  return response.data;
}
