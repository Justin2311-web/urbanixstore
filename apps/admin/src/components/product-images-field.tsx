"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImageItem =
  | { id: string; type: "existing"; url: string }
  | { id: string; type: "file"; fileIndex: number; url: string; name: string };

export function ProductImagesField({ images = [] }: { images?: string[] }) {
  const [items, setItems] = useState<ImageItem[]>(
    images.filter(Boolean).map((url) => ({
      id: `existing:${url}`,
      type: "existing",
      url,
    }))
  );

  const existingImages = useMemo(
    () => items.filter((item): item is Extract<ImageItem, { type: "existing" }> => item.type === "existing").map((item) => item.url),
    [items]
  );

  function moveItem(index: number, direction: -1 | 1) {
    setItems((current) => {
      const next = [...current];
      const target = index + direction;

      if (target < 0 || target >= next.length) {
        return current;
      }

      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <section className="grid gap-3 rounded-2xl border bg-card p-4">
      <div>
        <h2 className="text-sm font-extrabold">Product Images</h2>
        <p className="mt-1 text-xs text-muted-foreground">Upload square 1:1 images. Maximum 9 images. First image becomes the storefront thumbnail.</p>
      </div>
      <input name="existingProductImages" type="hidden" value={JSON.stringify(existingImages)} />
      <input
        name="productImageOrder"
        type="hidden"
        value={JSON.stringify(
          items.map((item) => (item.type === "existing" ? `existing:${item.url}` : `file:${item.fileIndex}`))
        )}
      />
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background p-4 text-center text-sm font-semibold text-muted-foreground">
        <Upload className="size-5 text-primary" />
        Upload product images
        <input
          accept="image/*"
          className="sr-only"
          multiple
          name="productImageFiles"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []).slice(0, Math.max(0, 9 - items.length));
            const nextItems = files.map((file, index) => ({
              fileIndex: index,
              id: `file:${index}:${file.name}`,
              name: file.name,
              type: "file" as const,
              url: URL.createObjectURL(file),
            }));

            setItems((current) => [...current.filter((item) => item.type === "existing"), ...nextItems].slice(0, 9));
          }}
          type="file"
        />
      </label>
      {items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {items.map((item, index) => (
            <div className="rounded-2xl border bg-background p-2" key={item.id}>
              <div className="aspect-square overflow-hidden rounded-xl bg-white">
                <img alt={item.type === "file" ? item.name : "Product image"} className="size-full object-cover" src={item.url} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-muted-foreground">Image {index + 1}</span>
                <div className="flex gap-1">
                  <Button disabled={index === 0} onClick={() => moveItem(index, -1)} size="icon-sm" type="button" variant="ghost">
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button disabled={index === items.length - 1} onClick={() => moveItem(index, 1)} size="icon-sm" type="button" variant="ghost">
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button onClick={() => setItems((current) => current.filter((candidate) => candidate.id !== item.id))} size="icon-sm" type="button" variant="ghost">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
