"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdaptedInteraction } from "@/db/types";

interface DragInteractionProps {
  interaction: AdaptedInteraction;
  onSubmit: (answer: string, correct: boolean) => void;
  tapClassName: string;
}

interface DraggableItem {
  id: string;
  label: string;
  correctPosition: number;
}

export function DragInteraction({
  interaction,
  onSubmit,
  tapClassName,
}: DragInteractionProps) {
  const correctOrder = interaction.options
    .filter((opt) => opt.correct)
    .map((opt) => opt.label);

  const items: DraggableItem[] = interaction.options.map((opt) => ({
    id: opt.id,
    label: opt.label,
    correctPosition: correctOrder.indexOf(opt.label),
  }));

  const [orderedItems, setOrderedItems] = React.useState<DraggableItem[]>(() => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  });

  const [submitted, setSubmitted] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedItems((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function handleSubmit() {
    const currentOrder = orderedItems.map((item) => item.label);
    const isCorrect =
      currentOrder.length === correctOrder.length &&
      currentOrder.every((label, index) => label === correctOrder[index]);

    const answer = orderedItems.map((item) => item.label).join(" → ");
    setSubmitted(true);
    onSubmit(answer, isCorrect);
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedItems}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {orderedItems.map((item, index) => (
              <SortableItem
                key={item.id}
                item={item}
                index={index}
                disabled={submitted}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {!submitted && (
        <Button size="lg" className={tapClassName} onClick={handleSubmit}>
          <Check className="size-5" aria-hidden="true" />
          Periksa jawaban
        </Button>
      )}
    </div>
  );
}

function SortableItem({
  item,
  index,
  disabled,
}: {
  item: DraggableItem;
  index: number;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center gap-3 rounded-lg border-2 bg-background p-4",
        isDragging && "opacity-50 shadow-lg",
        !disabled && "cursor-move hover:border-primary",
        disabled && "cursor-default"
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
        {index + 1}
      </span>
      <span className="flex-1 text-base">{item.label}</span>
    </div>
  );
}
