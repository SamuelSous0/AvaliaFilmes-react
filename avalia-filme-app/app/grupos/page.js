"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllGrupos,
  saveGrupo,
  updateGrupo,
  deleteGrupo,
  buscarGruposPorNome,
  adicionarMembro,
  removerMembro,
  adicionarFilme,
  removerFilme,
} from "../../services/grupoApi";
import styles from "./grupos.module.css";

const initialForm = { nome: "", descricao: "" };

export default function GruposPage() {
  const router = useRouter();
  const [grupos, setGrupos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editandoId, setEditandoId] = useState(null);
  const [gerenciandoId, setGerenciandoId] = useState(null);
  const [membroInput, setMembroInput] = useState("");
  const [filmeInput, setFilmeInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const loadGrupos = async () => {
    try {
      setLoading(true);
      const data = await getAllGrupos();
      const lista = Array.isArray(data) ? data : [];
      setGrupos(lista);
      setFiltrados(lista);
    } catch (error) {
      console.error(error);
      setMessage({ text: "Falha ao carregar grupos.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) { router.push("/login"); return; }
    loadGrupos();
  }, [router]);

  useEffect(() => {
    if (!busca.trim()) {
      setFiltrados(grupos);
    } else {
      setFiltrados(grupos.filter((g) =>
        g.nome?.toLowerCase().includes(busca.toLowerCase())
      ));
    }
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
      age: 0
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
      loadGrupos();
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
      loadGrupos();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao remover grupo.", type: "error" });
    }
  };

  const toggleGerenciar = (id) => {
    setGerenciandoId((prev) => (prev === id ? null : id));
    setMembroInput("");
    setFilmeInput("");
  };

  const handleAdicionarMembro = async (grupoId) => {
    if (!membroInput) return;
    try {
      await adicionarMembro(grupoId, Number(membroInput));
      setMessage({ text: "Membro adicionado com sucesso.", type: "success" });
      setMembroInput("");
      loadGrupos();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao adicionar membro.", type: "error" });
    }
  };

  const handleRemoverMembro = async (grupoId, perfilId) => {
    try {
      await removerMembro(grupoId, perfilId);
      setMessage({ text: "Membro removido com sucesso.", type: "success" });
      loadGrupos();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao remover membro.", type: "error" });
    }
  };

  const handleAdicionarFilme = async (grupoId) => {
    if (!filmeInput) return;
    try {
      await adicionarFilme(grupoId, Number(filmeInput));
      setMessage({ text: "Filme adicionado com sucesso.", type: "success" });
      setFilmeInput("");
      loadGrupos();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao adicionar filme.", type: "error" });
    }
  };

  const handleRemoverFilme = async (grupoId, filmeId) => {
    try {
      await removerFilme(grupoId, filmeId);
      setMessage({ text: "Filme removido com sucesso.", type: "success" });
      loadGrupos();
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
              {editandoId ? "Atualize as informações do grupo" : "Crie um novo grupo para reunir amigos e filmes"}
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

        {loading ? (
          <div className={styles.carregando}>Carregando grupos...</div>
        ) : filtrados.length === 0 ? (
          <div className={styles.vazio}>Nenhum grupo encontrado.</div>
        ) : (
          <div className={styles.listaGrupos}>
            {filtrados.map((grupo) => (
              <div key={grupo.id} className={styles.cardGrupo}>
                <div className={styles.cardGrupoTopo}>
                  <div>
                    <p className={styles.cardGrupoTitulo}>{grupo.nome}</p>
                    {grupo.descricao && (
                      <p className={styles.cardGrupoDescricao}>{grupo.descricao}</p>
                    )}
                    <p className={styles.cardGrupoDetalhe}>
                      {grupo.membros?.length || 0} membro(s) •{" "}
                      {grupo.filmes?.length || 0} filme(s)
                    </p>
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

                {gerenciandoId === grupo.id && (
                  <div className={styles.painelGerenciar}>

                    <div className={styles.secaoGerenciar}>
                      <p className={styles.secaoTitulo}>Membros</p>
                      <div className={styles.linhaAdicionar}>
                        <input
                          value={membroInput}
                          onChange={(e) => setMembroInput(e.target.value)}
                          placeholder="ID do perfil"
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
                              Perfil #{m.id}
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
                      <p className={styles.secaoTitulo}>Filmes</p>
                      <div className={styles.linhaAdicionar}>
                        <input
                          value={filmeInput}
                          onChange={(e) => setFilmeInput(e.target.value)}
                          placeholder="ID do filme"
                          className={styles.inputGerenciar}
                        />
                        <button
                          className={styles.botaoAdicionar}
                          onClick={() => handleAdicionarFilme(grupo.id)}
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