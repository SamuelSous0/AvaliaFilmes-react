import axios from 'axios';

const instance = axios.create ({
    baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
    headers: {"Conten-Type": "application/json"},
});

export async function getAllPostPerfis() {
    const response = await instance.get("/post-perfil");
    return response.data;
}

export async function getPostPerfilByPerfil(Id) {
    const response = await instance.get(`/post-perfil/perfil/${Id}`);
    return response.data;
}

export async function savePostPerfil(postPerfil) {
    const response = await instance.post("/post-perfil", postPerfil);
    return response.data;
}

export async function updatePostPerfil(Id, postPerfil) {
    const response = await instance.put(`/post-perfil/${Id}`, postPerfil);
    return response.data;
}

export async function deletePostPerfil(Id) {
    const response = await instance.delete(`/post-perfil/${Id}`);
    return response.data;
}
