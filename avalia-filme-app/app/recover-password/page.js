"use client";
import { useState } from "react";
import { recuperarSenha } from "../../services/userApi";
import { useRouter } from "next/navigation";
import styles from "./recuperar.module.css";

export default function RecuperarSenhaPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setMsg("");
    setLoading(true);
    try {
      await recuperarSenha(email);
      setMsg("Se este e-mail estiver cadastrado, você receberá o código em breve.");
    } catch {
      setMsg("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.containerAutenticacao}>
      <h2>Recuperar senha</h2>
      <p>Digite seu e-mail para receber o código de recuperação.</p>
      <input
        placeholder="E-mail"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      {msg && <p className={styles.msg}>{msg}</p>}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Enviando..." : "Enviar código"}
      </button>
      <button onClick={() => router.push("/login")}>Voltar ao login</button>
    </div>
  );
}