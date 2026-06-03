"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { redefinirSenha } from "../../services/userApi";
import styles from "./redefinir.module.css";

function RedefinirSenhaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [codigo, setCodigo] = useState(searchParams.get("codigo") || "");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErro("");
    setMsg("");
    if (novaSenha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await redefinirSenha(codigo, novaSenha);
      setMsg("Senha redefinida com sucesso! Redirecionando...");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setErro("Código inválido ou expirado. Solicite um novo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.containerAutenticacao}> 
      <h2>Redefinir senha</h2>
      <input
        placeholder="Código recebido por e-mail"
        value={codigo}
        onChange={e => setCodigo(e.target.value)}
      />
      <input
        type="password"
        placeholder="Nova senha (mín. 6 caracteres)"
        value={novaSenha}
        onChange={e => setNovaSenha(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirmar nova senha"
        value={confirmar}
        onChange={e => setConfirmar(e.target.value)}
      />
      {erro && <p className={styles.erro}>{erro}</p>}
      {msg && <p className={styles.msg}>{msg}</p>}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Salvando..." : "Salvar nova senha"}
      </button>
      <button onClick={() => router.push("/recover-password")}>Voltar</button> 
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}