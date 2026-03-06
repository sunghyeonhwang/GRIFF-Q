"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  link: string;
}

interface SearchResults {
  estimates: SearchResult[];
  meetings: SearchResult[];
  payments: SearchResult[];
  retrospectives: SearchResult[];
  projects: SearchResult[];
  tasks: SearchResult[];
  schedules: SearchResult[];
  users: SearchResult[];
}

const TYPE_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  견적서: { label: "견적서", variant: "default" },
  회의록: { label: "회의록", variant: "secondary" },
  "입금/결제": { label: "입금/결제", variant: "outline" },
  회고: { label: "회고", variant: "destructive" },
  프로젝트: { label: "프로젝트", variant: "default" },
  태스크: { label: "태스크", variant: "secondary" },
  일정: { label: "일정", variant: "outline" },
  팀원: { label: "팀원", variant: "default" },
};

export function SearchBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data: SearchResults = await res.json();
        setResults(data);
      }
    } catch {
      // Silently handle errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      search(value);
    }, 300);
  };

  const handleResultClick = (result: SearchResult) => {
    setOpen(false);
    router.push(result.link);
  };

  const allResults: SearchResult[] = results
    ? [
        ...results.estimates,
        ...results.meetings,
        ...results.payments,
        ...results.retrospectives,
        ...results.projects,
        ...results.tasks,
        ...results.schedules,
        ...results.users,
      ]
    : [];

  const hasResults = allResults.length > 0;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative"
      >
        <Search className="size-4" />
        <span className="sr-only">검색</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[20%] translate-y-0 p-0 sm:max-w-lg"
        >
          <DialogTitle className="sr-only">검색</DialogTitle>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="검색... (⌘K)"
              className="h-11 border-0 px-0 shadow-none focus-visible:ring-0"
            />
            {isLoading && (
              <Loader2 className="ml-2 size-4 shrink-0 animate-spin text-muted-foreground" />
            )}
          </div>

          {query.trim().length >= 2 && (
            <ScrollArea className="max-h-[300px]">
              <div className="p-2">
                {!isLoading && !hasResults && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    검색 결과 없음
                  </div>
                )}

                {hasResults &&
                  (
                    [
                      "estimates",
                      "meetings",
                      "payments",
                      "retrospectives",
                      "projects",
                      "tasks",
                      "schedules",
                      "users",
                    ] as const
                  ).map((key) => {
                    const items = results![key];
                    if (items.length === 0) return null;
                    return (
                      <div key={key} className="mb-2">
                        <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                          {items[0].type}
                        </p>
                        {items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleResultClick(item)}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                          >
                            <div className="flex-1 truncate">
                              <span className="font-medium">{item.title}</span>
                              {item.subtitle && (
                                <span className="ml-2 text-muted-foreground">
                                  {item.subtitle}
                                </span>
                              )}
                            </div>
                            <Badge
                              variant={
                                TYPE_CONFIG[item.type]?.variant ?? "secondary"
                              }
                              className="shrink-0 text-[10px]"
                            >
                              {item.type}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          )}

          {query.trim().length < 2 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              2자 이상 입력하세요
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
