"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface MemberSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function MemberSearch({ onSearch, placeholder = "Tìm kiếm thành viên..." }: MemberSearchProps) {
  const [value, setValue] = useState("");

  const debouncedSearch = useDebounce((query: string) => {
    onSearch(query);
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
