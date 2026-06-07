"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { savePostPerfil, updatePostPerfil, deletePostPerfil } from "@/services/postperfilApi";
import { getAllFilmes } from "@/services/filmeApi";
import styles from "./postPerfil.module.css";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

async function buscarPoster(titulo) {
    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(titulo)}&language=pt-BR`
        );
        const data = await res.json();
        const poster = data.results?.[0]?.poster_path;
        return poster ? `https://image.tmdb.org/t/p/w200${poster}` : null;
    } catch{
        return null;
    }   
}
const fetcher = (url) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1${url}`).then((res)=> res.json());

const initialForm= {descricao: "", filmeId: ""};

export default function PostPerfilPage(){
    const router = useRouter();
    const [filmes, setFilmes] = useState([]);
    const [posters, setPosters] = useState({});
    const [form, setForm ] = useState(initialForm);
    const [editandoId, setEditandoId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", type: ""});

    // para buscar posts
    const { data: posts, isLoading, mutate } = useSWR("/post-perfil", fetcher, {
        fallbackData: []
    });
    useEffect(()=>
    {
        const id = localStorage.getItem("userId");
        if (!id) { router.push("/login"); return; }
        loadFilmes();
    }, [router]);
    
    useEffect(() => {
        if (posts && posts.length > 0) {
            carregarPosters(posts);
        }
    }, [posts]);

    const loadFilmes = async () => {
        try {
            const data = await getAllFilmes();
            setFilmes(Array.isArray(data)? data : []);
        } catch (error){
            console.error(error);
        }
    };
    const carregarPosters = async (postsList) => {
        const postersMap ={};
        await Promise.all(
            postsList.map(async (post) =>{
                if (post.filme?.titulo){
                    const url = await buscarPoster(post.filme.titulo);
                    if(url) postersMap[post.filme.id] = url;
                }
            })
        );
        setPosters(postersMap);
    }

    const handleChange = (field, value) => setForm (prev=> ({...prev, [field]: value}));

    const abrirEdicao = (post) => {
        setEditandoId(post.id);
        setForm({ descricao: post.descricao || "", filmeId: String(post.filme?.id || "") });
    };

    const cancelarEdicao= ()=> {
        setEditandoId(null);
        setForm(initialForm);
        setMessage({ text: "", type: ""});
    };

    const handleSalvar = async ()=> {
        if (!form.descricao || !form.filmeId){
            setMessage({ text: "Preencha todos os campos.", type: "error"});
            return;
        }

        const perfilId = localStorage.getItem("perfilId");
        const payload = {
            descricao: form.descricao,
            perfil: { id: Number(perfilId) },
            filme: { id: Number(form.filmeId) }
        };
        console.log("payload:", payload);

        try {
            setSaving(true);
            if (editandoId){
                await updatePostPerfil(editandoId, payload);
                setMessage({ text: "Post atualizado com sucesso!", type: "success"});
                cancelarEdicao();
            } else {
                await savePostPerfil(payload);
                setMessage({ text: "Post criado com sucesso!", type: "success"});
                setForm(initialForm);
            }
            mutate(); // swr recarrega os post aut.
        } catch (error) {
            console.error(error);
            setMessage({ text: "Erro ao salvar o post.", type: "error"});
        } finally {
            setSaving(false);
        }
    };

    const handleDeletar = async (id) => {
        if (!confirm ("Tem certeza que deseja deletar este post?")) return;
        try {
        await deletePostPerfil(id);
        setMessage({ text: "Post deletado com sucesso!", type: "success"});
        mutate();
        } catch {
        setMessage({ text: "Erro ao deletar post.", type: "error"});
        }
    };

    const formatarData = (data) => {
        return new Date (data).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "long", year: "numeric"
        });
    };
        return (
            <div className={styles.container}>
                <h1 className={styles.titulo}>Posts de Filmes</h1>

                {/*form de criação*/}
                <div className={styles.formulario}>
                    <h2>{editandoId ? "Editar Post" : "Novo Post"}</h2>

                    <div className={styles.grupoFormulario}>
                        <label>Filme</label>
                        <select
                            value={form.filmeId}
                            onChange={e => handleChange("filmeId", e.target.value)}
                        >
                            <option value=""> Selecione um filme</option>
                            {filmes.map(filme => (
                                <option key={filme.id} value = {filme.id}> {filme.titulo}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.grupoFormulario}>
                        <label>Descrição</label>
                        <textarea
                            value={form.descricao}
                            onChange={e => handleChange("descricao", e.target.value)}
                            placeholder="O que você achou do filme?"
                            rows={4}
                            />
                    </div>
                    {message.text && (
                        <p className={`${styles.mensagem} ${message.type === "success"? styles.sucesso : styles.erro}`}>
                            {message.text}
                        </p>
                    )}
                    <div className={styles.acoes}>
                        <button className={styles.botaoSalvar} onClick= {handleSalvar} disabled={saving}>
                            {saving ? "Salvando..." : editandoId ? "Atualizar" : "Publicar"}
                        </button>
                        {editandoId && (
                            <button className={styles.botaoCancelar} onClick={cancelarEdicao}>
                                Cancelar
                            </button>
                        )}
                    </div>
                </div>
                {/*feed de posts*/}
                {isLoading ? (
                    <div className={styles.carregando}>Carregando posts...</div>
                ) : posts.length === 0 ? (
                    <p className={styles.semPosts}> Nenhum post foi encontrado.</p>
                ) : (
                    posts.map( post => (
                        <div key = {post.id} className={styles.card}>
                            <div className={styles.cardTopo}>
                                {posters[post.filme?.id] && (
                                    <img
                                        src = {posters[post.filme.id]}
                                        alt = {post.filme.titulo}
                                        style={{ width: 60, borderRadius: 6, marginRight: 12, objectFit:"cover"}}
                                    />
                                )}
                                <div style= {{ flex: 1}}>
                                    <div className = {styles.cardHeader}>
                                        <span className={styles.perfilNome}>@{post.perfil?.nome}</span>
                                        <span className={styles.data}> {formatarData(post.dataCriacao)}</span>
                                    </div>
                                    <p className={styles.filmeNome}>{post.filme?.titulo}</p>
                                    <p className={styles.genero}> {post.filme?.genero}</p>
                            </div>
                        </div>
                        <p className={styles.descricao}>{post.descricao}</p>
                        <div className={styles.cardAcoes}>
                            <button className={styles.botaoEditar} onClick={() => abrirEdicao(post)}>
                                ✏️ Editar
                            </button>
                            <button className={styles.botaoDeletar} onClick={() => handleDeletar(post.id)}>
                                🗑️ Deletar
                            </button>
                        </div>
                        </div>
                    ))
                )}
            </div>
        );
}
