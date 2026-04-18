import "./globals.css";

export const metadata = {
  title: "GraphTorch",
  description: "Diagram to PyTorch code generator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
