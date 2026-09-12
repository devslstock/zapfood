import { SimulatorChat } from "./SimulatorChat";

export default function SimulatorPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Simulador de WhatsApp</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Teste o atendimento automático sem precisar de credenciais reais da Meta. As
          mensagens passam pelo mesmo motor de conversa usado no WhatsApp de verdade.
        </p>
      </div>
      <SimulatorChat />
    </div>
  );
}
