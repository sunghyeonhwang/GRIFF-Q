"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Users } from "lucide-react";
import { VAT_RATE } from "@/lib/estimate-constants";

interface EstimateItem {
  id: string;
  estimate_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  highlight: string;
  note: string;
  sort_order: number;
}

interface PresenceUser {
  userId: string;
  userName: string;
  editingCell?: string | null;
}

interface RealtimeEstimateEditorProps {
  estimateId: string;
  initialItems: EstimateItem[];
  userId: string;
  userName: string;
}

const HIGHLIGHT_OPTIONS = [
  { value: "none", label: "없음" },
  { value: "yellow", label: "노랑" },
  { value: "red", label: "빨강" },
  { value: "green", label: "초록" },
  { value: "blue", label: "파랑" },
];

const PRESENCE_COLORS = [
  "border-blue-500",
  "border-purple-500",
  "border-pink-500",
  "border-orange-500",
  "border-teal-500",
];

const PRESENCE_BG_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-teal-500",
];

function formatNumber(value: number): string {
  return value ? value.toLocaleString() : "";
}

function parseNumber(value: string): number {
  return Number(value.replace(/[^0-9]/g, "")) || 0;
}

export function RealtimeEstimateEditor({
  estimateId,
  initialItems,
  userId,
  userName,
}: RealtimeEstimateEditorProps) {
  const [items, setItems] = useState<EstimateItem[]>(initialItems);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(
    new Set()
  );
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const itemsRef = useRef(items);

  // Keep itemsRef in sync
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const channel = supabase
      .channel(`estimate:${estimateId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "estimate_items",
          filter: `estimate_id=eq.${estimateId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as EstimateItem;
            setItems((prev) =>
              prev.map((item) =>
                item.id === updated.id ? { ...item, ...updated } : item
              )
            );
            // Brief highlight animation for remote changes
            const cellKey = `${updated.id}:updated`;
            setHighlightedCells((prev) => new Set(prev).add(cellKey));
            setTimeout(() => {
              setHighlightedCells((prev) => {
                const next = new Set(prev);
                next.delete(cellKey);
                return next;
              });
            }, 1500);
          } else if (payload.eventType === "INSERT") {
            const newItem = payload.new as EstimateItem;
            setItems((prev) => {
              if (prev.some((item) => item.id === newItem.id)) return prev;
              return [...prev, newItem].sort(
                (a, b) => a.sort_order - b.sort_order
              );
            });
          } else if (payload.eventType === "DELETE") {
            const oldItem = payload.old as { id: string };
            setItems((prev) => prev.filter((item) => item.id !== oldItem.id));
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        for (const key in state) {
          for (const presence of state[key]) {
            const p = presence as unknown as PresenceUser;
            if (p.userId !== userId) {
              users.push(p);
            }
          }
        }
        setPresenceUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId,
            userName,
            editingCell: null,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimateId, userId, userName]);

  // Track which cell we are editing via presence
  const trackEditingCell = useCallback(
    async (cellKey: string | null) => {
      setEditingCell(cellKey);
      if (channelRef.current) {
        await channelRef.current.track({
          userId,
          userName,
          editingCell: cellKey,
        });
      }
    },
    [userId, userName]
  );

  const debouncedSave = useCallback(
    (itemId: string, field: string, value: string | number) => {
      const timerKey = `${itemId}:${field}`;
      if (debounceTimers.current[timerKey]) {
        clearTimeout(debounceTimers.current[timerKey]);
      }
      debounceTimers.current[timerKey] = setTimeout(async () => {
        setSaving(true);
        await supabase
          .from("estimate_items")
          .update({ [field]: value })
          .eq("id", itemId);
        setSaving(false);
        delete debounceTimers.current[timerKey];
      }, 500);
    },
    [supabase]
  );

  const updateItemLocal = useCallback(
    (itemId: string, field: keyof EstimateItem, value: string | number) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      );
      debouncedSave(itemId, field, value);
    },
    [debouncedSave]
  );

  const addRow = useCallback(async () => {
    const maxOrder = items.reduce(
      (max, item) => Math.max(max, item.sort_order),
      -1
    );
    const { data, error } = await supabase
      .from("estimate_items")
      .insert({
        estimate_id: estimateId,
        item_name: "",
        quantity: 1,
        unit_price: 0,
        highlight: "",
        note: "",
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    if (data && !error) {
      setItems((prev) => [...prev, data as EstimateItem]);
    }
  }, [estimateId, items, supabase]);

  const removeRow = useCallback(
    async (itemId: string) => {
      if (items.length <= 1) return;
      const { error } = await supabase
        .from("estimate_items")
        .delete()
        .eq("id", itemId);
      if (!error) {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
      }
    },
    [items.length, supabase]
  );

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  // Find which cells other users are editing
  const otherEditingCells = new Map<string, { userName: string; colorIndex: number }>();
  presenceUsers.forEach((user, index) => {
    if (user.editingCell) {
      otherEditingCells.set(user.editingCell, {
        userName: user.userName,
        colorIndex: index % PRESENCE_COLORS.length,
      });
    }
  });

  function getCellBorderClass(itemId: string, field: string): string {
    const key = `${itemId}:${field}`;
    const other = otherEditingCells.get(key);
    if (other) {
      return `border-2 ${PRESENCE_COLORS[other.colorIndex]}`;
    }
    if (highlightedCells.has(`${itemId}:updated`)) {
      return "bg-yellow-50 dark:bg-yellow-900/20 transition-colors duration-1000";
    }
    return "";
  }

  return (
    <div className="space-y-4">
      {/* Online users */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>접속 중:</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="size-7 rounded-full bg-green-500 flex items-center justify-center text-xs font-medium text-white">
              {userName.charAt(0)}
            </div>
            <span className="text-sm font-medium">{userName} (나)</span>
          </div>
          {presenceUsers.map((user, index) => (
            <div key={user.userId} className="flex items-center gap-1.5">
              <div
                className={`size-7 rounded-full ${PRESENCE_BG_COLORS[index % PRESENCE_BG_COLORS.length]} flex items-center justify-center text-xs font-medium text-white`}
              >
                {user.userName.charAt(0)}
              </div>
              <span className="text-sm">{user.userName}</span>
            </div>
          ))}
        </div>
        {saving && (
          <Badge variant="outline" className="ml-auto text-xs">
            저장 중...
          </Badge>
        )}
      </div>

      {/* Items table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">#</TableHead>
              <TableHead>항목명</TableHead>
              <TableHead className="w-[90px]">수량</TableHead>
              <TableHead className="w-[140px]">단가</TableHead>
              <TableHead className="w-[130px]">금액</TableHead>
              <TableHead className="w-[140px]">비고</TableHead>
              <TableHead className="w-[100px]">강조색</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const amount =
                Number(item.quantity) * Number(item.unit_price);
              return (
                <TableRow key={item.id}>
                  <TableCell className="text-center text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className={getCellBorderClass(item.id, "item_name")}>
                    <Input
                      value={item.item_name}
                      onChange={(e) =>
                        updateItemLocal(item.id, "item_name", e.target.value)
                      }
                      onFocus={() => trackEditingCell(`${item.id}:item_name`)}
                      onBlur={() => trackEditingCell(null)}
                      placeholder="항목명"
                      className="border-0 shadow-none focus-visible:ring-0 px-1"
                    />
                  </TableCell>
                  <TableCell className={getCellBorderClass(item.id, "quantity")}>
                    <Input
                      value={String(item.quantity)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        updateItemLocal(item.id, "quantity", val);
                      }}
                      onFocus={() => trackEditingCell(`${item.id}:quantity`)}
                      onBlur={() => trackEditingCell(null)}
                      placeholder="0"
                      className="border-0 shadow-none focus-visible:ring-0 px-1 text-right"
                    />
                  </TableCell>
                  <TableCell
                    className={getCellBorderClass(item.id, "unit_price")}
                  >
                    <Input
                      value={formatNumber(Number(item.unit_price))}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        updateItemLocal(item.id, "unit_price", val);
                      }}
                      onFocus={() =>
                        trackEditingCell(`${item.id}:unit_price`)
                      }
                      onBlur={() => trackEditingCell(null)}
                      placeholder="0"
                      className="border-0 shadow-none focus-visible:ring-0 px-1 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {amount.toLocaleString()}원
                  </TableCell>
                  <TableCell className={getCellBorderClass(item.id, "note")}>
                    <Input
                      value={item.note ?? ""}
                      onChange={(e) =>
                        updateItemLocal(item.id, "note", e.target.value)
                      }
                      onFocus={() => trackEditingCell(`${item.id}:note`)}
                      onBlur={() => trackEditingCell(null)}
                      placeholder="비고"
                      className="border-0 shadow-none focus-visible:ring-0 px-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.highlight || "none"}
                      onValueChange={(v) =>
                        updateItemLocal(
                          item.id,
                          "highlight",
                          v === "none" ? "" : v
                        )
                      }
                    >
                      <SelectTrigger className="border-0 shadow-none h-8">
                        <SelectValue placeholder="없음" />
                      </SelectTrigger>
                      <SelectContent>
                        {HIGHLIGHT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(item.id)}
                      disabled={items.length <= 1}
                      className="size-8"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-6"
                >
                  항목이 없습니다. 아래 버튼으로 추가하세요.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add row button */}
      <div>
        <Button variant="outline" onClick={addRow}>
          <Plus className="mr-2 size-4" />
          항목 추가
        </Button>
      </div>

      {/* Totals */}
      <div className="flex flex-col items-end space-y-1 text-sm">
        <div className="flex w-[300px] justify-between">
          <span className="text-muted-foreground">소계</span>
          <span className="font-medium">{subtotal.toLocaleString()}원</span>
        </div>
        <div className="flex w-[300px] justify-between">
          <span className="text-muted-foreground">
            부가세({Math.round(VAT_RATE * 100)}%)
          </span>
          <span className="font-medium">{vat.toLocaleString()}원</span>
        </div>
        <div className="flex w-[300px] justify-between border-t pt-1">
          <span className="font-semibold">총액</span>
          <span className="font-semibold text-lg">
            {total.toLocaleString()}원
          </span>
        </div>
      </div>
    </div>
  );
}
