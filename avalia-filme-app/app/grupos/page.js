"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  saveGrupo,
  updateGrupo,
  deleteGrupo,
  adicionarMembro,
  removerMembro,
  adicionarFilme,
  removerFilme,
} from "../../services/grupoApi";
import FilmePoster from "../components/FilmePoster/FilmePoster";
import styles from "./grupos.module.css";

const fetcher = (url) => fetch(url).then((res) => res.json());
const initialForm = { nome: "", descricao: "" };

export default function GruposPage() {
  const router = useRouter();

  const [busca, setBusca] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editandoId, setEditandoId] = useState(null);
  const [gerenciandoId, setGerenciandoId] = useState(null);
  const [expandidoId, setExpandidoId] = useState(null);
  const [membroInput, setMembroInput] = useState("");
  const [filmeInput, setFilmeInput] = useState("");
  const [filmeSelecionado, setFilmeSelecionado] = useState(null);
  const [filmeSugestoes, setFilmeSugestoes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (!userId) router.push("/login");
  }, [router]);

  const { data, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/grupos/allGrupos`,
    fetcher
  );

  const { data: perfisData } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/perfis/all`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: filmesData } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/filmes/allFilmes`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const grupos = useMemo(() => Array.isArray(data) ? data : [], [data]);

  const filtrados = useMemo(() => {
    if (!busca.trim()) return grupos;
    return grupos.filter((g) =>
      g.nome?.toLowerCase().includes(busca.toLowerCase())
    );
  }, [busca, grupos]);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      setMessage({ text: "O nome do grupo não pode ser vazio.", type: "error" });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        criador: {
          id: Number(userId),
          username: localStorage.getItem("username") || "",
          email: "placeholder@email.com",
          password: "placeholder",
          age: 0,
        },
      };
      if (editandoId) {
        await updateGrupo(editandoId, payload);
        setMessage({ text: "Grupo atualizado com sucesso.", type: "success" });
      } else {
        await saveGrupo(payload);
        setMessage({ text: "Grupo criado com sucesso.", type: "success" });
      }
      setForm(initialForm);
      setEditandoId(null);
      mutate();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao salvar grupo.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = (grupo) => {
    setEditandoId(grupo.id);
    setForm({ nome: grupo.nome, descricao: grupo.descricao || "" });
    setGerenciandoId(null);
    setMessage({ text: "", type: "" });
  };

  const handleCancelar = () => {
    setEditandoId(null);
    setForm(initialForm);
    setMessage({ text: "", type: "" });
  };

  const handleDeletar = async (id) => {
    try {
      await deleteGrupo(id);
      setMessage({ text: "Grupo removido com sucesso.", type: "success" });
      if (expandidoId === id) setExpandidoId(null);
      mutate();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao remover grupo.", type: "error" });
    }
  };

  const toggleGerenciar = (id) => {
    setGerenciandoId((prev) => (prev === id ? null : id));
    setMembroInput("");
    setFilmeInput("");
    setFilmeSelecionado(null);
    setFilmeSugestoes([]);
  };

  const toggleExpandir = (id) => {
    setExpandidoId((prev) => (prev === id ? null : id));
  };

  const handleFilmeInputChange = (valor) => {
    setFilmeInput(valor);
    setFilmeSelecionado(null);
    if (!valor.trim()) {
      setFilmeSugestoes([]);
      return;
    }
    const filmes = Array.isArray(filmesData) ? filmesData : [];
    const q = valor.toLowerCase();
    const sugestoes = filmes
      .filter((f) => f.titulo?.toLowerCase().includes(q))
      .slice(0, 6);
    setFilmeSugestoes(sugestoes);
  };

  const handleSelecionarFilme = (filme) => {
    setFilmeSelecionado({ id: filme.id, label: filme.titulo });
    setFilmeInput(filme.titulo);
    setFilmeSugestoes([]);
  };

  const handleAdicionarMembro = async (grupoId) => {
  if (!membroInput.trim()) return;
    try {
      await adicionarMembro(grupoId, Number(membroInput));
      setMessage({ text: "Membro adicionado com sucesso.", type: "success" });
      setMembroInput("");
      mutate();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao adicionar membro.", type: "error" });
    }
  };

  const handleRemoverMembro = async (grupoId, perfilId) => {
    try {
      await removerMembro(grupoId, perfilId);
      setMessage({ text: "Membro removido com sucesso.", type: "success" });
      mutate();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao remover membro.", type: "error" });
    }
  };

  const handleAdicionarFilme = async (grupoId) => {
    if (!filmeSelecionado) {
      setMessage({ text: "Selecione um filme válido da lista.", type: "error" });
      return;
    }
    try {
      await adicionarFilme(grupoId, filmeSelecionado.id);
      setMessage({ text: "Filme adicionado com sucesso.", type: "success" });
      setFilmeInput("");
      setFilmeSelecionado(null);
      setFilmeSugestoes([]);
      mutate();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao adicionar filme.", type: "error" });
    }
  };

  const handleRemoverFilme = async (grupoId, filmeId) => {
    try {
      await removerFilme(grupoId, filmeId);
      setMessage({ text: "Filme removido com sucesso.", type: "success" });
      mutate();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao remover filme.", type: "error" });
    }
  };

  return (
    <div className={styles.containerGrupos}>

      <div className={styles.cartaoGrupos}>
        <div className={styles.cabecalho}>
          <div>
            <h2>{editandoId ? "Editar Grupo" : "Criar Grupo"}</h2>
            <p className={styles.subtitulo}>
              {editandoId
                ? "Atualize as informações do grupo"
                : "Crie um novo grupo para reunir amigos e filmes"}
            </p>
          </div>
        </div>

        {message.text && (
          <p className={`${styles.mensagem} ${message.type === "success" ? styles.sucesso : styles.erro}`}>
            {message.text}
          </p>
        )}

        <div className={styles.formulario}>
          <div className={styles.grupoFormulario}>
            <label>Nome do Grupo</label>
            <input
              value={form.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Ex: Fãs de Terror"
            />
          </div>
          <div className={styles.grupoFormulario}>
            <label>Descrição</label>
            <textarea
              value={form.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
              placeholder="Descreva o grupo..."
            />
          </div>
          <div className={styles.acoes}>
            <button className={styles.botaoSalvar} onClick={handleSalvar} disabled={saving}>
              {saving ? "Salvando..." : editandoId ? "Atualizar Grupo" : "Criar Grupo"}
            </button>
            {editandoId && (
              <button className={styles.botaoCancelar} onClick={handleCancelar}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.cartaoGrupos}>
        <div className={styles.listaHeader}>
          <h3>Grupos</h3>
          <span>{filtrados.length} grupo(s)</span>
        </div>

        <input
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className={styles.inputBusca}
        />

        {isLoading ? (
          <div className={styles.carregando}>Carregando grupos...</div>
        ) : filtrados.length === 0 ? (
          <div className={styles.vazio}>Nenhum grupo encontrado.</div>
        ) : (
          <div className={styles.listaGrupos}>
            {filtrados.map((grupo) => (
              <div key={grupo.id} className={styles.cardGrupo}>

                <div className={styles.cardGrupoTopo}>
                  <div
                    className={styles.cardGrupoHeader}
                    onClick={() => toggleExpandir(grupo.id)}
                  >
                    <div className={styles.cardGrupoNomeArea}>
                      <p className={styles.cardGrupoTitulo}>{grupo.nome}</p>
                      {grupo.descricao && (
                        <p className={styles.cardGrupoDescricao}>{grupo.descricao}</p>
                      )}
                      <p className={styles.cardGrupoDetalhe}>
                        {grupo.membros?.length || 0} membro(s) •{" "}
                        {grupo.filmes?.length || 0} filme(s)
                      </p>
                    </div>
                    <span className={styles.chevron}>
                      {expandidoId === grupo.id ? "▲" : "▼"}
                    </span>
                  </div>

                  <div className={styles.cardGrupoAcoes}>
                    <button className={styles.botaoEditar} onClick={() => handleEditar(grupo)}>
                      Editar
                    </button>
                    <button className={styles.botaoGerenciar} onClick={() => toggleGerenciar(grupo.id)}>
                      {gerenciandoId === grupo.id ? "Fechar" : "Gerenciar"}
                    </button>
                    <button className={styles.botaoExcluir} onClick={() => handleDeletar(grupo.id)}>
                      Excluir
                    </button>
                  </div>
                </div>

                {/* conteúdo expandido com animação */}
                <AnimatePresence initial={false}>
                  {expandidoId === grupo.id && (
                    <motion.div
                      key="expandido"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className={styles.expandidoInner}>
                        <div className={styles.expandidoContent}>

                          <div className={styles.expandidoSection}>
                            <p className={styles.expandidoSectionTitle}>Membros</p>
                            {grupo.membros?.length > 0 ? (
                              <div className={styles.membrosLista}>
                                {grupo.membros.map((m) => (
                                  <span key={m.id} className={styles.membroTag}>
                                    {m.user ? `${m.user.username} #${m.user.id}` : `Usuário #${m.id}`}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className={styles.vazioSection}>Nenhum membro neste grupo.</p>
                            )}
                          </div>

                          <div className={styles.expandidoSection}>
                            <p className={styles.expandidoSectionTitle}>Filmes</p>
                            {grupo.filmes?.length > 0 ? (
                              <div className={styles.filmesGrid}>
                                {grupo.filmes.map((f) => (
                                  <div key={f.id} className={styles.filmeCard}>
                                    <FilmePoster titulo={f.titulo} />
                                    <p className={styles.filmeTitulo}>{f.titulo}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className={styles.vazioSection}>Nenhum filme adicionado ainda.</p>
                            )}
                          </div>

                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* painel de gerenciamento */}
                {gerenciandoId === grupo.id && (
                  <div className={styles.painelGerenciar}>

                    <div className={styles.secaoGerenciar}>
                      <p className={styles.secaoTitulo}>Adicionar membro</p>
                      <div className={styles.linhaAdicionar}>
                        <input
                          value={membroInput}
                          onChange={(e) => setMembroInput(e.target.value)}
                          placeholder="ID do membro Ex: 5"
                          className={styles.inputGerenciar}
                        />
                        <button
                          className={styles.botaoAdicionar}
                          onClick={() => handleAdicionarMembro(grupo.id)}
                        >
                          Adicionar
                        </button>
                      </div>
                      {grupo.membros?.length > 0 && (
                        <div className={styles.listaTags}>
                          {grupo.membros.map((m) => (
                            <span key={m.id} className={styles.tag}>
                               {m.user ? `${m.user.username} #${m.user.id}` : `Usuário #${m.id}`}
                              <button
                                className={styles.tagRemover}
                                onClick={() => handleRemoverMembro(grupo.id, m.id)}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={styles.secaoGerenciar}>
                      <p className={styles.secaoTitulo}>Adicionar filme</p>
                      <div className={styles.linhaAdicionar}>
                        <div className={styles.inputComSugestoes}>
                          <input
                            value={filmeInput}
                            onChange={(e) => handleFilmeInputChange(e.target.value)}
                            placeholder="Buscar filme pelo título"
                            className={styles.inputGerenciar}
                            autoComplete="off"
                          />
                          {filmeSugestoes.length > 0 && (
                            <ul className={styles.sugestoesLista}>
                              {filmeSugestoes.map((f) => (
                                <li
                                  key={f.id}
                                  className={styles.sugestaoItem}
                                  onMouseDown={() => handleSelecionarFilme(f)}
                                >
                                  <span className={styles.sugestaoNome}>{f.titulo}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <button
                          className={styles.botaoAdicionar}
                          onClick={() => handleAdicionarFilme(grupo.id)}
                          disabled={!filmeSelecionado}
                        >
                          Adicionar
                        </button>
                      </div>
                      {grupo.filmes?.length > 0 && (
                        <div className={styles.listaTags}>
                          {grupo.filmes.map((f) => (
                            <span key={f.id} className={styles.tag}>
                              {f.titulo}
                              <button
                                className={styles.tagRemover}
                                onClick={() => handleRemoverFilme(grupo.id, f.id)}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}