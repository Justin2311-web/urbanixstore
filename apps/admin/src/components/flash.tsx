export function Flash({
  saved,
  saveError,
}: {
  saved?: string;
  saveError?: string;
}) {
  if (saveError) {
    return (
      <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        ❌ Error: {decodeURIComponent(saveError)}
      </div>
    );
  }
  if (saved === "1") {
    return (
      <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
        ✓ Changes saved successfully.
      </div>
    );
  }
  return null;
}
