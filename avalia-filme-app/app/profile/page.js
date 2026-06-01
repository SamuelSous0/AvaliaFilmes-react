"use client";
import { useState, useEffect } from "react";
import { updateUser, deleteUser, getUserById } from "../../services/userApi";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    age: "",
    bio: "",
    photoUrl: "" 
  });
  const [userId, setUserId] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) { 
      router.push("/login"); 
      return; 
    }
    setUserId(id);
    loadUserData(id);
  }, []);

  const loadUserData = async (id) => {
    try {
      const data = await getUserById(id);
      setForm({
        name: data.name || "",
        email: data.email || "",
        password: "",
        age: data.age || "",
        bio: data.bio || "",
        photoUrl: data.photoUrl || ""
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setMsg({ text: "Salvando...", type: "info" });
    try {
      await updateUser(userId, form);
      setMsg({ text: "Perfil atualizado com sucesso!", type: "success" });
      localStorage.setItem("username", form.name);
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    } catch {
      setMsg({ text: "Erro ao atualizar perfil.", type: "error" });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja deletar sua conta permanentemente?")) return;
    try {
      await deleteUser(userId);
      localStorage.clear();
      router.push("/login");
    } catch {
      setMsg({ text: "Erro ao deletar conta.", type: "error" });
    }
  };

  if (loading) return <div className="loading">Carregando perfil...</div>;

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar-container">
            {form.photoUrl ? (
              <img src={form.photoUrl} alt="Profile" className="avatar-image" />
            ) : (
              <div className="avatar-placeholder">{form.name.charAt(0)}</div>
            )}
          </div>
          <h2>{form.name}</h2>
          <p className="user-email">{form.email}</p>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label>Foto (URL)</label>
            <input 
              placeholder="https://exemplo.com/foto.jpg"
              value={form.photoUrl}
              onChange={e => setForm({ ...form, photoUrl: e.target.value })} 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nome</label>
              <input 
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label>Idade</label>
              <input 
                type="number" 
                value={form.age}
                onChange={e => setForm({ ...form, age: e.target.value })} 
              />
            </div>
          </div>

          <div className="form-group">
            <label>E-mail</label>
            <input 
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} 
            />
          </div>

          <div className="form-group">
            <label>Biografia</label>
            <textarea 
              placeholder="Conte um pouco sobre você..."
              value={form.bio}
              rows={3}
              onChange={e => setForm({ ...form, bio: e.target.value })} 
            />
          </div>

          <div className="form-group">
            <label>Nova Senha</label>
            <input 
              type="password" 
              placeholder="Deixe em branco para manter a atual"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} 
            />
          </div>

          {msg.text && <p className={`message ${msg.type}`}>{msg.text}</p>}

          <div className="actions">
            <button className="btn-save" onClick={handleUpdate}>Salvar Alterações</button>
            <button className="btn-logout" onClick={handleLogout}>Sair</button>
          </div>
          
          <button className="btn-delete" onClick={handleDelete}>Deletar Conta</button>
        </div>
      </div>
    </div>
  );
}