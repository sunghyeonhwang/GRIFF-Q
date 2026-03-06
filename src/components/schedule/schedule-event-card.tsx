"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Pencil, Trash2, Calendar, Clock } from "lucide-react";
import { SCHEDULE_CATEGORY_CONFIG, type Schedule } from "@/types/schedule.types";

interface ScheduleEventCardProps {
  schedule: Schedule;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export function ScheduleEventCard({
  schedule,
  canEdit,
  onEdit,
  onDelete,
  children,
}: ScheduleEventCardProps) {
  const config = SCHEDULE_CATEGORY_CONFIG[schedule.category];

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          {/* 카테고리 뱃지 + 제목 */}
          <div>
            <Badge
              style={{ backgroundColor: config.color, color: "#fff" }}
              className="mb-1"
            >
              {config.label}
            </Badge>
            <h4 className="text-sm font-medium">{schedule.title}</h4>
          </div>

          {/* 설명 */}
          {schedule.description && (
            <p className="text-xs text-muted-foreground">{schedule.description}</p>
          )}

          {/* 날짜/시간 */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>
              {schedule.start_date}
              {schedule.end_date && schedule.end_date !== schedule.start_date
                ? ` ~ ${schedule.end_date}`
                : ""}
            </span>
          </div>

          {!schedule.is_all_day && schedule.start_time && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <span>
                {schedule.start_time}
                {schedule.end_time ? ` ~ ${schedule.end_time}` : ""}
              </span>
            </div>
          )}

          {/* 작성자 */}
          {schedule.creator?.name && (
            <p className="text-xs text-muted-foreground">
              작성: {schedule.creator.name}
            </p>
          )}

          {/* 수정/삭제 */}
          {canEdit && (
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="size-3.5 mr-1" /> 수정
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="size-3.5 mr-1" /> 삭제
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
