"use client";

import { useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type OptionRow = { key: number; name?: string; price?: number; imageUrl?: string };
type GroupRow = {
  key: number;
  name?: string;
  required: boolean;
  multiple: boolean;
  options: OptionRow[];
};

let nextGroupKey = 0;
let nextOptionKey = 0;

function emptyGroup(): GroupRow {
  return { key: nextGroupKey++, required: false, multiple: false, options: [] };
}

function moveItem<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function OptionGroupFields({
  initial = [],
}: {
  initial?: {
    name: string;
    minSelect: number;
    maxSelect: number;
    options: { name: string; priceCents: number; imageUrl?: string | null }[];
  }[];
}) {
  const [groups, setGroups] = useState<GroupRow[]>(
    initial.length
      ? initial.map((group) => ({
          key: nextGroupKey++,
          name: group.name,
          required: group.minSelect >= 1,
          multiple: group.maxSelect > 1,
          options: group.options.map((option) => ({
            key: nextOptionKey++,
            name: option.name,
            price: option.priceCents / 100,
            imageUrl: option.imageUrl ?? undefined,
          })),
        }))
      : []
  );

  function addGroup() {
    setGroups((prev) => [...prev, emptyGroup()]);
  }

  function removeGroup(groupKey: number) {
    setGroups((prev) => prev.filter((g) => g.key !== groupKey));
  }

  function updateGroup(groupKey: number, patch: Partial<GroupRow>) {
    setGroups((prev) => prev.map((g) => (g.key === groupKey ? { ...g, ...patch } : g)));
  }

  function addOption(groupKey: number) {
    setGroups((prev) =>
      prev.map((g) =>
        g.key === groupKey ? { ...g, options: [...g.options, { key: nextOptionKey++ }] } : g
      )
    );
  }

  function removeOption(groupKey: number, optionKey: number) {
    setGroups((prev) =>
      prev.map((g) =>
        g.key === groupKey
          ? { ...g, options: g.options.filter((o) => o.key !== optionKey) }
          : g
      )
    );
  }

  function handleDragEnd(result: DropResult) {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === "group") {
      setGroups((prev) => moveItem(prev, source.index, destination.index));
      return;
    }

    // type === "option": droppableId é a key do grupo dono da lista de opções.
    const groupKey = Number(source.droppableId);
    if (source.droppableId !== destination.droppableId) return;
    setGroups((prev) =>
      prev.map((g) =>
        g.key === groupKey ? { ...g, options: moveItem(g.options, source.index, destination.index) } : g
      )
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="block text-sm font-medium text-zinc-700">
          Sabores e adicionais (opcional)
        </span>
        <button
          type="button"
          onClick={addGroup}
          className="text-sm font-medium text-brand-dark hover:underline"
        >
          + adicionar grupo
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="groups" type="group">
          {(groupsProvided) => (
            <div ref={groupsProvided.innerRef} {...groupsProvided.droppableProps} className="mt-3 flex flex-col gap-4">
              {groups.map((group, groupIndex) => (
                <Draggable key={group.key} draggableId={`group-${group.key}`} index={groupIndex}>
                  {(groupDragProvided) => (
                    <div
                      ref={groupDragProvided.innerRef}
                      {...groupDragProvided.draggableProps}
                      className="rounded-xl border border-zinc-200 p-4"
                    >
                      <input type="hidden" name="groupKey" value={group.key} />
                      <input type="hidden" name="groupMin" value={group.required ? 1 : 0} />
                      <input type="hidden" name="groupMax" value={group.multiple ? 99 : 1} />

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          {...groupDragProvided.dragHandleProps}
                          aria-label="Arrastar grupo"
                          className="-m-2 cursor-grab p-2 text-lg text-zinc-300 hover:text-zinc-500 active:cursor-grabbing"
                        >
                          ⠿
                        </span>
                        <input
                          name="groupName"
                          defaultValue={group.name}
                          placeholder='Ex: "Escolha o acompanhamento"'
                          className="min-w-[200px] flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                        <label className="flex items-center gap-1 text-sm text-zinc-600">
                          <input
                            type="checkbox"
                            checked={group.required}
                            onChange={(e) => updateGroup(group.key, { required: e.target.checked })}
                            className="rounded border-zinc-300"
                          />
                          Obrigatório
                        </label>
                        <label className="flex items-center gap-1 text-sm text-zinc-600">
                          <input
                            type="checkbox"
                            checked={group.multiple}
                            onChange={(e) => updateGroup(group.key, { multiple: e.target.checked })}
                            className="rounded border-zinc-300"
                          />
                          Múltipla escolha
                        </label>
                        <button
                          type="button"
                          onClick={() => removeGroup(group.key)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          remover grupo
                        </button>
                      </div>

                      <Droppable droppableId={String(group.key)} type="option">
                        {(optionsProvided) => (
                          <div
                            ref={optionsProvided.innerRef}
                            {...optionsProvided.droppableProps}
                            className="mt-3 flex flex-col gap-3 border-t border-zinc-100 pt-3"
                          >
                            {group.options.map((option, optionIndex) => (
                              <Draggable
                                key={option.key}
                                draggableId={`option-${option.key}`}
                                index={optionIndex}
                              >
                                {(optionDragProvided) => (
                                  <div
                                    ref={optionDragProvided.innerRef}
                                    {...optionDragProvided.draggableProps}
                                    className="flex flex-wrap items-start gap-2"
                                  >
                                    <input type="hidden" name="optionGroupKey" value={group.key} />
                                    <span
                                      {...optionDragProvided.dragHandleProps}
                                      aria-label="Arrastar opção"
                                      className="-m-2 mt-1 cursor-grab p-2 text-lg text-zinc-300 hover:text-zinc-500 active:cursor-grabbing"
                                    >
                                      ⠿
                                    </span>
                                    <input
                                      name="optionName"
                                      defaultValue={option.name}
                                      placeholder="Purê de batata"
                                      className="min-w-[160px] flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                                    />
                                    <div className="relative w-28">
                                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-400">
                                        R$
                                      </span>
                                      <input
                                        name="optionPrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        defaultValue={option.price ?? 0}
                                        placeholder="0,00"
                                        className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                                      />
                                    </div>
                                    <div className="w-full sm:w-auto">
                                      <ImageUploadField
                                        name="optionImageUrl"
                                        kind="option"
                                        label="Foto (opcional)"
                                        initialUrl={option.imageUrl}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeOption(group.key, option.key)}
                                      className="self-start pt-2 text-sm text-red-600 hover:underline"
                                    >
                                      remover
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {optionsProvided.placeholder}
                            <button
                              type="button"
                              onClick={() => addOption(group.key)}
                              className="self-start text-sm font-medium text-brand-dark hover:underline"
                            >
                              + adicionar opção
                            </button>
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}
                </Draggable>
              ))}
              {groupsProvided.placeholder}
              {groups.length === 0 && (
                <p className="text-xs text-zinc-400">
                  Nenhum grupo. Use para sabores (ex: escolha 1) ou adicionais (ex: extras opcionais).
                </p>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
