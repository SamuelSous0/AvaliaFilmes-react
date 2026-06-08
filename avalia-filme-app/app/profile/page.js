"use client";
import { useState, useEffect, useRef } from "react";
import { updateUser, deleteUser, getUserById } from "../../services/userApi";
import {
  savePerfil,
  updatePerfil,
  getAllPerfis,
  deletePerfil,
} from "../../services/perfilApi";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    photoUrl: "",
  });
  const [userId, setUserId] = useState(null);
  const [perfilId, setPerfilId] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const dotVariants = {
    animate: {
      scale: [0.5, 1, 0.5],
      opacity: [0.3, 1, 0.3],
    },
  };

  const dotTransition = (i) => ({
    duration: 1.2,
    repeat: Infinity,
    ease: "linear",
    delay: i * 0.15,
  });

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) {
      router.push("/login");
      return;
    }
    setUserId(id);
    loadAllData(id);
  }, []);

  const loadAllData = async (id) => {
    try {
      if (!id || id === "undefined") {
        console.error("ID de usuário inválido detectado no localStorage.");
        router.push("/login");
        return;
      }

      const userData = await getUserById(id);

      if (!userData) {
        throw new Error("Dados do usuário não encontrados.");
      }

      const allPerfis = await getAllPerfis();
      const meuPerfil = allPerfis.find((p) => p.username === userData.name);

      setForm({
        name: userData.name || "",
        email: userData.email || "",
        password: "",
        bio: meuPerfil?.biografia || "",
        photoUrl: meuPerfil?.fotoUrl || "",
      });

      if (meuPerfil) {
        setPerfilId(meuPerfil.id);
        localStorage.setItem("perfilId", meuPerfil.id);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setMsg({ text: "Formato inválido. Use JPG, PNG, WebP ou GIF.", type: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ text: "Imagem muito grande. Máximo 5 MB.", type: "error" });
      return;
    }

    setUploadingPhoto(true);
    setMsg({ text: "Enviando foto...", type: "info" });

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "profile_photos");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Falha no upload");
      }

      const data = await response.json();
      setForm((prev) => ({ ...prev, photoUrl: data.secure_url }));
      setMsg({ text: "Foto carregada! Salve as alterações para confirmar.", type: "success" });
    } catch (error) {
      console.error("Erro no upload Cloudinary:", error);
      setMsg({ text: `Erro ao enviar foto: ${error.message}`, type: "error" });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setMsg({ text: "", type: "" }), 4000);
    }
  };

  const handleUpdate = async () => {
    setMsg({ text: "Salvando...", type: "info" });
    let erroUsuario = false;
    let erroPerfil = false;

    try {
      try {
        const perfilPayload = {
          userId: Number(userId),
          biografia: form.bio,
          fotoUrl: form.photoUrl,
        };
        if (perfilId) {
          await updatePerfil(perfilId, perfilPayload);
        } else {
          await savePerfil(perfilPayload);
        }
      } catch (e) {
        console.error("Erro no Perfil:", e.response?.data ?? e);
        erroPerfil = true;
      }

      // 2. Atualiza dados de Usuário apenas se a senha for fornecida
      if (form.password) {
        try {
          await updateUser(userId, {
            name: form.name,
            email: form.email,
            password: form.password,
          });
          localStorage.setItem("username", form.name);
        } catch (e) {
          console.error("Erro no Usuário:", e.response?.data ?? e);
          erroUsuario = true;
        }
      }

      // 3. Feedback final
      if (erroUsuario && erroPerfil) {
        setMsg({ text: "Erro ao salvar alterações.", type: "error" });
      } else if (erroUsuario) {
        setMsg({
          text: "Perfil salvo, mas erro ao atualizar dados de login (verifique a senha).",
          type: "error",
        });
      } else if (erroPerfil) {
        setMsg({ text: "Erro ao salvar foto/biografia.", type: "error" });
      } else {
        setMsg({ text: "Alterações salvas com sucesso!", type: "success" });
        setForm((prev) => ({ ...prev, password: "" }));
        await loadAllData(userId);
      }

      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Erro geral:", error);
      setMsg({ text: "Ocorreu um erro inesperado.", type: "error" });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja deletar sua conta permanentemente?"))
      return;
    try {
      if (perfilId) {
        await deletePerfil(perfilId);
      }
      await deleteUser(userId);
      localStorage.clear();
      router.push("/login");
    } catch {
      setMsg({ text: "Erro ao deletar conta.", type: "error" });
    }
  };

  if (loading)
    return (
      <div className={styles.carregando}>
        <div style={{ width: 40, height: 40, position: "relative" }}>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              variants={dotVariants}
              animate="animate"
              transition={dotTransition(i)}
              style={{
                width: 10,
                height: 10,
                backgroundColor: "var(--primary-color)",
                borderRadius: "50%",
                position: "absolute",
                top: 20 + 15 * Math.sin((i * 45 * Math.PI) / 180) - 5,
                left: 20 + 15 * Math.cos((i * 45 * Math.PI) / 180) - 5,
              }}
            />
          ))}
        </div>
        <span>Carregando perfil...</span>
      </div>
    );

  return (
    <div className={styles.containerPerfil}>
      <div className={styles.cartaoPerfil}>
        <div className={styles.headerPerfil}>
          <div className={styles.containerAvatar}>
            {form.photoUrl ? (
              <img
                src={form.photoUrl}
                alt="Profile"
                className={styles.imagemAvatar}
              />
            ) : (
              <div className={styles.marcadorAvatar}>{form.name.charAt(0)}</div>
            )}
          </div>
          <h2>{form.name}</h2>
          <p className={styles.emailUsuario}>{form.email}</p>
        </div>

        <div className={styles.formularioPerfil}>
          <div className={styles.grupoFormulario}>
            <label>Foto de Perfil</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className={styles.inputFoto}
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
            />
            <button
              type="button"
              className={styles.botaoUpload}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? "Enviando..." : form.photoUrl ? "Trocar Foto" : "Escolher Foto"}
            </button>
            {form.photoUrl && (
              <button
                type="button"
                className={styles.botaoDeletar}
                style={{ marginTop: 4 }}
                onClick={() => setForm((prev) => ({ ...prev, photoUrl: "" }))}
              >
                Remover foto
              </button>
            )}
          </div>

          <div className={styles.linhaFormulario}>
            <div className={styles.grupoFormulario}>
              <label>Nome</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.grupoFormulario}>
            <label>E-mail</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className={styles.grupoFormulario}>
            <label>Biografia</label>
            <textarea
              placeholder="Conte um pouco sobre você..."
              value={form.bio}
              rows={3}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          <div className={styles.grupoFormulario}>
            <label>Nova Senha</label>
            <input
              type="password"
              placeholder="Deixe em branco para manter a atual"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {msg.text && (
            <p
              className={`${styles.mensagem} ${
                msg.type === "success"
                  ? styles.sucesso
                  : msg.type === "error"
                  ? styles.erro
                  : styles.info
              }`}
            >
              {msg.text}
            </p>
          )}

          <div className={styles.acoes}>
            <button className={styles.botaoSalvar} onClick={handleUpdate}>
              Salvar Alterações
            </button>
            <button className={styles.botaoSair} onClick={handleLogout}>
              Sair
            </button>
          </div>

          <button className={styles.botaoDeletar} onClick={handleDelete}>
            Deletar Conta
          </button>
        </div>
      </div>
    </div>
  );
}
