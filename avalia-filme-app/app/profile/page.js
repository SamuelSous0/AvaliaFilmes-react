"use client";
import { useState, useEffect } from "react";
import { updateUser, deleteUser } from "../../services/userApi";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", age: "" });
  const [userId, setUserId] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const name = localStorage.getItem("username");
    if (!id) { router.push("/login"); return; }
    setUserId(id);
    setForm(f => ({ ...f, name }));
  }, []);

  const handleUpdate = async () => {
    try {
      await updateUser(userId, form);
      setMsg("Perfil atualizado!");
    } catch {
      setMsg("Erro ao atualizar.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleDelete = async () => {
    if (!confirm("Deseja deletar sua conta?")) return;
    await deleteUser(userId);
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="auth-container">
      <h2>Meu perfil</h2>
      <input placeholder="Nome"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })} />
      <input placeholder="E-mail"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Nova senha (opcional)"
        value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })} />
      <input type="number" placeholder="Idade"
        value={form.age}
        onChange={e => setForm({ ...form, age: e.target.value })} />
      {msg && <p className="success">{msg}</p>}
      <button onClick={handleUpdate}>Salvar alterações</button>
      <button onClick={handleLogout}>Sair</button>
      <button onClick={handleDelete} style={{ color: "red" }}>Deletar conta</button>
    </div>
  );
}