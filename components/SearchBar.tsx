import { useState, type FormEvent } from "react";
import { BsSearch } from "react-icons/bs";
import { TbCurrentLocation } from "react-icons/tb";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onUseLocation: () => void;
}

const SearchBar = ({ onSearch, onUseLocation }: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onSearch(trimmed);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 w-full"
    >
      <div className="flex items-center flex-1 gap-2 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur focus-within:ring-2 focus-within:ring-white/60">
        <BsSearch className="text-white/70" size={18} aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-white placeholder:text-white/50 focus:outline-none text-lg"
          type="text"
          placeholder="Search a city"
          aria-label="Search a city"
        />
        <button
          type="submit"
          aria-label="Search"
          className="text-white/80 hover:text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <BsSearch size={18} />
        </button>
      </div>
      <button
        type="button"
        onClick={onUseLocation}
        aria-label="Use my location"
        title="Use my location"
        className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white/80 hover:text-white hover:bg-white/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <TbCurrentLocation size={20} />
      </button>
    </form>
  );
};

export default SearchBar;
