"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import styles from "./Navbar.module.css";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState("");
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    // Função para verificar o estado do login
    const checkLogin = () => {
      const id = localStorage.getItem("userId");
      const name = localStorage.getItem("username");
      if (id && name) {
        setIsLogged(true);
        setUsername(name);
      } else {
        setIsLogged(false);
        setUsername("");
      }
    };

    checkLogin();
  }, [pathname]); // Re-executa sempre que a rota mudar

  const handleLogout = () => {
    localStorage.clear();
    setIsLogged(false);
    setUsername("");
    router.push("/login");
  };

  const navVariants = {
    hidden: { y: -50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  if (!isLogged) {
    return (
      <motion.nav 
        className={styles.navbarPrincipal}
        initial="hidden"
        animate="visible"
        variants={navVariants}
      >
        <div className={styles.navbarLogo}>
          <Link href="/login">AvaliaFilmes</Link>
        </div>
        <div className={styles.navbarUsuario}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/login"
              style={{
                color: "#ffcc00",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Entrar
            </Link>
          </motion.div>
        </div>
      </motion.nav>
    );
  }

  return (
    <motion.nav 
      className={styles.navbarPrincipal}
      initial="hidden"
      animate="visible"
      variants={navVariants}
    >
      <div className={styles.navbarLogo}>
        <Link href="/">AvaliaFilmes</Link>
      </div>

      <ul className={styles.navbarLinks}>
        <motion.li whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Link href="/">Início</Link>
        </motion.li>
        <motion.li whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Link href="/filmes">Filmes</Link>
        </motion.li>   
        <motion.li whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Link href="/grupos">Grupos</Link>
        </motion.li>
        <motion.li whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Link href="/post-perfil">Posts</Link>
        </motion.li>
        <motion.li whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Link href="/profile">Meu Perfil</Link>
        </motion.li>
      </ul>

      <div className={styles.navbarUsuario}>
        <span>Olá, {username}</span>
        <motion.button 
          onClick={handleLogout} 
          className={styles.botaoSairNavbar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Sair
        </motion.button>
      </div>
    </motion.nav>
  );
}
