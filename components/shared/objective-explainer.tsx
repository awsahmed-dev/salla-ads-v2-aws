import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ObjectiveExplainerCard {
  title: string;
  description: string;
  icon?: ReactNode;
}

interface ObjectiveExplainerProps {
  className?: string;
  highlight?: ReactNode;
  secondary?: ReactNode;
  cards?: ObjectiveExplainerCard[];
  stepsTitle?: string;
  steps?: string[];
}

export function ObjectiveExplainer({
  className,
  highlight,
  secondary,
  cards = [],
  stepsTitle,
  steps = [],
}: ObjectiveExplainerProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {highlight && (
        <div className="rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2">
          <p className="text-[11px] text-muted-foreground">{highlight}</p>
        </div>
      )}

      {secondary && (
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">{secondary}</p>
        </div>
      )}

      {cards.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {cards.map((card) => (
            <div key={card.title} className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3">
              <div className="mb-1 flex items-center gap-1.5">
                {card.icon}
                <p className="text-xs font-semibold text-foreground">{card.title}</p>
              </div>
              <p className="text-[11px] text-muted-foreground">{card.description}</p>
            </div>
          ))}
        </div>
      )}

      {steps.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          {stepsTitle && <p className="text-xs font-semibold text-foreground">{stepsTitle}</p>}
          <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[11px] text-muted-foreground">
            {steps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
