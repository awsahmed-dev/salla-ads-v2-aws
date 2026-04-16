"use client";

import { useState } from "react";
import type { MetaCarouselCard } from "@/lib/meta/campaign-types";
import { FORMAT_TEXT_LIMITS } from "@/lib/meta/creative-constants";
import { CharCounter, makeCarouselCard } from "./helpers";
import { UploadZone } from "@/components/shared/upload-zone";
import {
  ProductPickerDialog,
  type SallaProduct,
} from "@/components/shared/product-picker";
import { formatSAR } from "@/lib/salla/store-api";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, GripVertical, ShoppingBag } from "lucide-react";

export function CarouselCardEditor({
  cards,
  onUpdate,
}: {
  cards: MetaCarouselCard[];
  onUpdate: (cards: MetaCarouselCard[]) => void;
}) {
  const limits = FORMAT_TEXT_LIMITS.CAROUSEL;
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleCardMediaUpload = (index: number, file: File) => {
    const url = URL.createObjectURL(file);
    const updated = [...cards];
    updated[index] = { ...updated[index], imageUrl: url, file };
    onUpdate(updated);
  };

  const updateCard = (index: number, updates: Partial<MetaCarouselCard>) => {
    const updated = [...cards];
    updated[index] = { ...updated[index], ...updates };
    onUpdate(updated);
  };

  const removeCard = (index: number) =>
    onUpdate(cards.filter((_, i) => i !== index));

  const addCard = () => {
    if (cards.length < 5) onUpdate([...cards, makeCarouselCard(cards.length)]);
  };

  const handleProductsSelected = (products: SallaProduct[]) => {
    const remaining = 5 - cards.length;
    const newCards: MetaCarouselCard[] = products.slice(0, remaining).map((p, i) => {
      const price = p.salePrice
        ? formatSAR(p.salePrice, { showCurrency: false })
        : formatSAR(p.price, { showCurrency: false });
      return {
        id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${i}`,
        imageUrl: p.image,
        headline: p.name.slice(0, limits.headline),
        description: `${price} ${p.currency}`.slice(0, limits.description),
        link: p.url,
      };
    });
    onUpdate([...cards, ...newCards]);
    setPickerOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-foreground">
          Carousel Cards ({cards.length}/5)
        </Label>
        <div className="flex items-center gap-1.5">
          {cards.length < 5 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPickerOpen(true)}
                className="h-7 gap-1 text-xs"
              >
                <ShoppingBag className="size-3" /> Add Products
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addCard}
                className="h-7 gap-1 text-xs"
              >
                <Plus className="size-3" /> Add Card
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {cards.map((card, i) => (
          <div
            key={card.id}
            className="rounded-lg border border-border bg-muted/10 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GripVertical className="size-3 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-foreground">
                  Card {i + 1}
                </span>
              </div>
              {cards.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeCard(i)}
                  className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-[100px_1fr]">
              <UploadZone
                accept="image/*,video/*"
                label="Media"
                sublabel="1:1 or 4:5"
                preview={card.imageUrl || undefined}
                onFile={(f) => handleCardMediaUpload(i, f)}
                onClear={() =>
                  updateCard(i, { imageUrl: "", file: undefined })
                }
                compact
              />
              <div className="flex flex-col gap-1.5">
                <div>
                  <Input
                    value={card.headline || ""}
                    onChange={(e) =>
                      updateCard(i, { headline: e.target.value })
                    }
                    placeholder="Card headline"
                    className="h-7 text-xs"
                    maxLength={limits.headline}
                  />
                  <div className="mt-0.5 text-right">
                    <CharCounter
                      current={(card.headline || "").length}
                      max={limits.headline}
                    />
                  </div>
                </div>
                <div>
                  <Input
                    value={card.description || ""}
                    onChange={(e) =>
                      updateCard(i, { description: e.target.value })
                    }
                    placeholder="Card description"
                    className="h-7 text-xs"
                    maxLength={limits.description}
                  />
                  <div className="mt-0.5 text-right">
                    <CharCounter
                      current={(card.description || "").length}
                      max={limits.description}
                    />
                  </div>
                </div>
                <Input
                  value={card.link || ""}
                  onChange={(e) => updateCard(i, { link: e.target.value })}
                  placeholder="https://store.salla.sa/product/..."
                  className="h-7 font-mono text-[10px]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <ProductPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        existingProductNames={cards.map((c) => c.headline || "").filter(Boolean)}
        maxProducts={5 - cards.length}
        onAddProducts={handleProductsSelected}
      />
    </div>
  );
}
