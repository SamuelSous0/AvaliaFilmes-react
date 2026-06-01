"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
      <nav className="navbar-principal">
        <div className="navbar-logo">
          <Link href="/login">AvaliaFilmes</Link>
        </div>
        <div className="navbar-usuario">
          <Link href="/login" style={{color: '#ffcc00', textDecoration: 'none', fontWeight: 'bold'}}>Entrar</Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar-principal">
      <div className="navbar-logo">
        <Link href="/">AvaliaFilmes</Link>
      </div>
      
      <ul className="navbar-links">
        <li>
          <Link href="/">Início</Link>
        </li>
        <li>
          <Link href="/profile">Meu Perfil</Link>
        </li>
      </ul>

      <div className="navbar-usuario">
        <span>Olá, {username}</span>
        <button onClick={handleLogout} className="btn-sair-navbar">Sair</button>
      </div>
    </nav>
  );
}

