"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ProductVariantGroup } from "@ecommerce/shared";

type VariantOptionDraft = {
  id: string;
  value: string;
  price: string;
  stockQty: string;
  sku: string;
};

type VariantGroupDraft = {
  id: string;
  name: string;
  options: VariantOptionDraft[];
  collapsed: boolean;
};

function makeOption(): VariantOptionDraft {
  return { id: crypto.randomUUID(), value: "", price: "", stockQty: "", sku: "" };
}

function makeGroup(): VariantGroupDraft {
  return { id: crypto.randomUUID(), name: "", options: [makeOption()], collapsed: false };
}

function serializeGroups(groups: VariantGroupDraft[]): ProductVariantGroup[] {
  return groups
    .filter((g) => g.name.trim())
    .map((g, gi) => ({
      id: g.id,
      optionName: g.name.trim(),
      sortOrder: gi,
      options: g.options
        .filter((o) => o.value.trim())
        .map((o, oi) => ({
          id: o.id,
          productId: "",
          optionName: g.name.trim(),
          optionValue: o.value.trim(),
          price: Number(o.price) || 0,
          priceAdjustment: 0,
          sku: o.sku.trim() || undefined,
          stockQuantity: Number(o.stockQty) || 0,
          isActive: true,
          sortOrder: oi,
        })),
    }))
    .filter((g) => g.options.length > 0);
}

function fromExisting(existing: ProductVariantGroup[]): VariantGroupDraft[] {
  return existing.map((g) => ({
    id: g.id || crypto.randomUUID(),
    name: g.optionName,
    collapsed: false,
    options: g.options.length > 0
      ? g.options.map((o) => ({
          id: o.id || crypto.randomUUID(),
          value: o.optionValue,
          price: o.price != null ? String(o.price) : String(o.priceAdjustment || ""),
          stockQty: o.stockQuantity != null ? String(o.stockQuantity) : "",
          sku: o.sku ?? "",
        }))
      : [makeOption()],
  }));
}

export function VariantsField({ existing }: { existing?: ProductVariantGroup[] }) {
  const [groups, setGroups] = useState<VariantGroupDraft[]>(() =>
    existing && existing.length > 0 ? fromExisting(existing) : []
  );

  const serialized = JSON.stringify(serializeGroups(groups));

  function addGroup() {
    setGroups((prev) => [...prev, makeGroup()]);
  }

  function removeGroup(gid: string) {
    setGroups((prev) => prev.filter((g) => g.id !== gid));
  }

  function toggleCollapse(gid: string) {
    setGroups((prev) => prev.map((g) => g.id === gid ? { ...g, collapsed: !g.collapsed } : g));
  }

  function updateGroupName(gid: string, name: string) {
    setGroups((prev) => prev.map((g) => g.id === gid ? { ...g, name } : g));
  }

  function addOption(gid: string) {
    setGroups((prev) => prev.map((g) =>
      g.id === gid ? { ...g, options: [...g.options, makeOption()] } : g
    ));
  }

  function removeOption(gid: string, oid: string) {
    setGroups((prev) => prev.map((g) =>
      g.id === gid ? { ...g, options: g.options.filter((o) => o.id !== oid) } : g
    ));
  }

  function updateOption(gid: string, oid: string, field: keyof Omit<VariantOptionDraft, "id">, val: string) {
    setGroups((prev) => prev.map((g) =>
      g.id === gid
        ? { ...g, options: g.options.map((o) => o.id === oid ? { ...o, [field]: val } : o) }
        : g
    ));
  }

  return (
    <section className="grid gap-4 rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold">Product Variants</h2>
          <p className="text-xs text-muted-foreground">Add color, size, model or any option with its own price, stock, and SKU.</p>
        </div>
        <button
          className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
          onClick={addGroup}
          type="button"
        >
          <Plus className="size-3.5" /> Add Variant Group
        </button>
      </div>

      <input name="variantGroupsJson" type="hidden" value={serialized} />

      {groups.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">No variants yet. Click &ldquo;Add Variant Group&rdquo; to define Color, Size, Model, etc.</p>
      )}

      {groups.map((group) => (
        <div className="rounded-xl border bg-muted/30 p-3" key={group.id}>
          {/* Group header */}
          <div className="mb-3 flex items-center gap-2">
            <Input
              className="flex-1 font-semibold"
              onChange={(e) => updateGroupName(group.id, e.target.value)}
              placeholder="Variant name, e.g. Color or Size"
              value={group.name}
            />
            <button
              className="rounded-lg p-1.5 hover:bg-secondary"
              onClick={() => toggleCollapse(group.id)}
              title={group.collapsed ? "Expand" : "Collapse"}
              type="button"
            >
              {group.collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </button>
            <button
              className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
              onClick={() => removeGroup(group.id)}
              title="Remove group"
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          {!group.collapsed && (
            <>
              {/* Column headers */}
              <div className="mb-1 hidden grid-cols-[1fr_100px_80px_120px_36px] gap-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
                <span>Option Value</span>
                <span>Price (RM)</span>
                <span>Stock Qty</span>
                <span>SKU</span>
                <span />
              </div>

              {/* Options */}
              {group.options.map((opt) => (
                <div className="mb-2 grid gap-2 md:grid-cols-[1fr_100px_80px_120px_36px] md:items-center" key={opt.id}>
                  <Input
                    onChange={(e) => updateOption(group.id, opt.id, "value", e.target.value)}
                    placeholder="e.g. Red, S, Model A"
                    value={opt.value}
                  />
                  <Input
                    min="0"
                    onChange={(e) => updateOption(group.id, opt.id, "price", e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    value={opt.price}
                  />
                  <Input
                    min="0"
                    onChange={(e) => updateOption(group.id, opt.id, "stockQty", e.target.value)}
                    placeholder="0"
                    type="number"
                    value={opt.stockQty}
                  />
                  <Input
                    onChange={(e) => updateOption(group.id, opt.id, "sku", e.target.value)}
                    placeholder="SKU-001"
                    value={opt.sku}
                  />
                  <button
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    disabled={group.options.length === 1}
                    onClick={() => removeOption(group.id, opt.id)}
                    title="Remove option"
                    type="button"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}

              <button
                className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                onClick={() => addOption(group.id)}
                type="button"
              >
                <Plus className="size-3" /> Add option
              </button>
            </>
          )}
        </div>
      ))}
    </section>
  );
}
