"use client";
import { useState } from "react";
import { userLogin } from "../../services/userApi";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" }); 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await userLogin({
        email: form.email.trim(),  
        password: form.password.trim()
      });
      localStorage.setItem("userId", user.id);
      localStorage.setItem("username", user.name);
      router.push("/");
    } catch {
      setError("Usuário ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.containerAutenticacao}>
      <h2>Entrar</h2>
      <input
        placeholder="E-mail"
        value={form.email}                                          
        onChange={e => setForm({ ...form, email: e.target.value })} 
      />
      <input
        type="password"
        placeholder="Senha"
        value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })}
      />
      {error && <p className={styles.erro}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
      <button onClick={() => router.push("/register")}>Criar conta</button>
    </div>
  );
}