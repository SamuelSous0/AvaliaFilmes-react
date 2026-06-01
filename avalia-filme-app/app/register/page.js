"use client";
import { useState } from "react";
import { userSignUp } from "../../services/userApi";
import { useRouter } from "next/navigation";

import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", age: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (form.password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await userSignUp({ ...form, age: Number(form.age) });
      router.push("/login");
    } catch {
      setError("Erro ao cadastrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.containerAutenticacao}>
      <h2>Criar conta</h2>
      <input placeholder="Nome"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })} />
      <input placeholder="E-mail"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Senha (mín. 6 caracteres)"
        value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })} />
      <input type="number" placeholder="Idade"
        value={form.age}
        onChange={e => setForm({ ...form, age: e.target.value })} />
      {error && <p className={styles.erro}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Cadastrando..." : "Cadastrar"}
      </button>
      <button onClick={() => router.push("/login")}>Já tenho conta</button>
    </div>
  );
}