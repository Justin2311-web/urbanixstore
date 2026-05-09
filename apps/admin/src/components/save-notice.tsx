export function SaveNotice({ saved }: { saved?: string }) {
  if (saved !== "1") {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
      Changes saved to Supabase. Refresh the storefront to see the latest dynamic content.
    </div>
  );
}
