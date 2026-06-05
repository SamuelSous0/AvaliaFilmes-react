"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
    <motion.div 
      className={styles.containerHome}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <header className={styles.headerHome}>
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Bem-vindo ao AvaliaFilmes, {username}!
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          O seu lugar favorito para organizar e avaliar seus filmes assistidos.
        </motion.p>
      </header>
    </motion.div>
  );
}