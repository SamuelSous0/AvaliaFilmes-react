import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "AvaliaFilmes",
  description: "Sistema de avaliação de filmes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
