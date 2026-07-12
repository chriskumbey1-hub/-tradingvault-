"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ tags, onChange, placeholder = "Add tag...", maxTags = 10 }: TagInputProps) {
  const [input, setInput] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
      onChange([...tags, trimmed]);
      setInput("");
      setShowSuggestions(false);
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/20"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-blue-500/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length >= maxTags ? `Max ${maxTags} tags` : placeholder}
          disabled={tags.length >= maxTags}
          className="h-8 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addTag(input)}
          disabled={!input.trim() || tags.length >= maxTags}
          className="h-8 px-2"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-[10px] text-zinc-500">
        Press Enter or comma to add. {tags.length}/{maxTags} tags.
      </p>
    </div>
  );
}
