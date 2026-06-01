"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

  // Se não estiver logado, podemos optar por mostrar uma navbar simplificada ou apenas a logo
  if (!isLogged) {
    return (
      <nav className={styles.navbarPrincipal}>
        <div className={styles.navbarLogo}>
          <Link href="/login">AvaliaFilmes</Link>
        </div>
        <div className={styles.navbarUsuario}>
          <Link href="/login" style={{color: '#ffcc00', textDecoration: 'none', fontWeight: 'bold'}}>Entrar</Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.navbarPrincipal}>
      <div className={styles.navbarLogo}>
        <Link href="/">AvaliaFilmes</Link>
      </div>
      
      <ul className={styles.navbarLinks}>
        <li>
          <Link href="/">Início</Link>
        </li>
        <li>
          <Link href="/profile">Meu Perfil</Link>
        </li>
      </ul>

      <div className={styles.navbarUsuario}>
        <span>Olá, {username}</span>
        <button onClick={handleLogout} className={styles.botaoSairNavbar}>Sair</button>
      </div>
    </nav>
  );
}

