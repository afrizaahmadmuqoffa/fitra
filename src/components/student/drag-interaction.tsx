"use client";

import * as React from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdaptedInteraction } from "@/db/types";

interface DragInteractionProps { interaction: AdaptedInteraction; onSubmit: (answer: string, correct: boolean) => void; tapClassName: string; }
interface DraggableItem { id: string; label: string; correctPosition: number; }

export function DragInteraction({ interaction, onSubmit, tapClassName }: DragInteractionProps) {
  const correctOrder = interaction.options.filter((opt) => opt.correct).map((opt) => opt.label);
  const items = interaction.options.map((opt) => ({ id: opt.id, label: opt.label, correctPosition: correctOrder.indexOf(opt.label) }));

  const [orderedItems, setOrderedItems] = React.useState<DraggableItem[]>(() => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  });
  const [submitted, setSubmitted] = React.useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedItems((current) => arrayMove(current, current.findIndex((item) => item.id === active.id), current.findIndex((item) => item.id === over.id)));
  }

  function handleSubmit() {
    const currentOrder = orderedItems.map((item) => item.label);
    const isCorrect = currentOrder.length === correctOrder.length && currentOrder.every((label, index) => label === correctOrder[index]);
    setSubmitted(true);
    onSubmit(currentOrder.join(" → "), isCorrect);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/6 px-3 py-2 text-xs font-bold text-white/60">Geser pilihan untuk menyusun urutan yang benar.</div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedItems} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orderedItems.map((item, index) => <SortableItem key={item.id} item={item} index={index} disabled={submitted} />)}
          </div>
        </SortableContext>
      </DndContext>
      {!submitted && <Button size="lg" className={`${tapClassName} w-full bg-white font-black text-[#17352f] hover:bg-[#f6f5ef] active:scale-[0.98]`} onClick={handleSubmit}><Check className="size-5" /> Periksa urutannya</Button>}
    </div>
  );
}

function SortableItem({ item, index, disabled }: { item: DraggableItem; index: number; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners} className={cn("group flex min-h-16 touch-none items-center gap-3 rounded-[1.35rem] border-2 border-white/10 bg-white/8 px-3 text-white outline-none transition-[background-color,border-color,transform,box-shadow] duration-180 ease-out", !disabled && "cursor-grab hover:border-[#bfead4]/40 hover:bg-white/12 active:cursor-grabbing", isDragging && "z-20 scale-[1.01] border-[#ffe9a6] bg-white/15 shadow-2xl", disabled && "cursor-default")}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-black text-[#bfead4]">{index + 1}</span>
      <span className="flex-1 text-base font-bold">{item.label}</span>
      <GripVertical className="size-5 text-white/35" aria-hidden="true" />
    </div>
  );
}
