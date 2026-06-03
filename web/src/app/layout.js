import "./globals.css";

export const metadata = {
  title: "Divvy",
  description: "Divide gastos con tus amigos",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
