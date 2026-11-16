"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#081a38",
          color: "#f7f4ed",
          fontFamily: "Georgia, 'Times New Roman', serif",
          padding: "2rem",
        }}
      >
        <main style={{ maxWidth: "560px", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: "0.72rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#e8b04b",
              marginBottom: "1.5rem",
            }}
          >
            DATASYS · Incident technique
          </p>
          <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.4rem)", lineHeight: 1.05, margin: "0 0 1.25rem" }}>
            Le site a besoin d’un instant pour se rétablir.
          </h1>
          <p style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.65, color: "#c9d3e3" }}>
            Une erreur critique est survenue. Rechargez la page pour reprendre votre visite.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              border: 0,
              borderRadius: "999px",
              padding: "0.95rem 1.6rem",
              background: "#e8b04b",
              color: "#081a38",
              fontFamily: "Arial, sans-serif",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Recharger la page
          </button>
        </main>
      </body>
    </html>
  );
}
