export default function SemAcessoPage() {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-100">
      <h1 className="text-xl font-bold text-zinc-900">Sem acesso a nenhuma página</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Sua conta ainda não tem nenhum acesso liberado no painel. Peça para o dono(a) da loja
        habilitar pelo menos uma permissão em Configurações → Equipe.
      </p>
    </div>
  );
}
