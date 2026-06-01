"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Verifica se o usuário está logado
    const id = localStorage.getItem("userId");
    const name = localStorage.getItem("username");

    if (!id) {
      router.push("/login");
    } else {
      setUsername(name);
    }
  }, [router]);

  return (
    <div className={styles.containerHome}>
      <header className={styles.headerHome}>
        <h1>Bem-vindo ao AvaliaFilmes, {username}!</h1>
        <p>O seu lugar favorito para organizar e avaliar seus filmes assistidos.</p>
      </header>
    </div>
  );
}