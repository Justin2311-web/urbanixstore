export function SaveNotice({ saved, saveError }: { saved?: string; saveError?: string }) {
  if (saveError) {
    return (
      <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
        Save failed: {decodeURIComponent(saveError)}
      </div>
    );
  }

  if (saved !== "1") {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
      Changes saved to Supabase. Refresh the storefront to see the latest dynamic content.
    </div>
  );
}
