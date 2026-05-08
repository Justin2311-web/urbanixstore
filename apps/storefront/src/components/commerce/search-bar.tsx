import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar({
  defaultValue,
  placeholder = "Search products...",
}: {
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <form action="/search" className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="h-12 rounded-2xl pl-11"
        defaultValue={defaultValue}
        name="q"
        placeholder={placeholder}
      />
    </form>
  );
}
