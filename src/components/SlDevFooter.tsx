export function SlDevFooter({ variant = "light" }: { variant?: "light" | "dark" }) {
  const textColor = variant === "dark" ? "text-white/40" : "text-zinc-400";
  const linkColor = variant === "dark" ? "hover:text-white/70" : "hover:text-zinc-600";

  return (
    <p className={`py-6 text-center text-xs ${textColor}`}>
      Desenvolvido pela{" "}
      <a
        href="https://sldev.com.br"
        target="_blank"
        rel="noopener noreferrer"
        className={`underline underline-offset-2 ${linkColor}`}
      >
        SL Desenvolvimentos
      </a>
      .
    </p>
  );
}
