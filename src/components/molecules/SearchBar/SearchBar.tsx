import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
}

export function SearchBar({
  placeholder = "검색어를 입력하세요",
  onSearch,
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const keyword = formData.get("search") as string;
    onSearch?.(keyword);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
      <Input
        type="text"
        name="search"
        placeholder={placeholder}
        className="flex-1"
      />
      <Button type="submit" variant="default">
        <Search className="h-4 w-4 mr-1" />
        검색
      </Button>
    </form>
  );
}
