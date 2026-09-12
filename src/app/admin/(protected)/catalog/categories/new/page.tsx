import Link from "next/link";
import { createCategoryAction } from "../../actions";

export default function NewCategoryPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-bold text-zinc-900">Nova categoria</h1>
      <form action={createCategoryAction} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            Nome
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Sorvetes"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Salvar
          </button>
          <Link
            href="/admin/catalog"
            className="rounded-full border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
