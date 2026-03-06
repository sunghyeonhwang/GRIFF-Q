export type ScheduleCategory =
  | "vacation"
  | "salary_review"
  | "birthday"
  | "holiday"
  | "company"
  | "meeting"
  | "other";

export interface Schedule {
  id: string;
  title: string;
  description: string | null;
  category: ScheduleCategory;
  start_date: string;
  end_date: string | null;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  color: string | null;
  created_by: string;
  is_public: boolean;
  target_user_id: string | null;
  created_at: string;
  // joined
  creator?: { name: string } | null;
}

export const SCHEDULE_CATEGORY_CONFIG: Record<
  ScheduleCategory,
  { label: string; color: string; icon: string }
> = {
  vacation: { label: "방학", color: "#10B981", icon: "Palmtree" },
  salary_review: { label: "연봉협상", color: "#F97316", icon: "HandCoins" },
  birthday: { label: "생일", color: "#EC4899", icon: "Cake" },
  holiday: { label: "공휴일", color: "#EF4444", icon: "CalendarOff" },
  company: { label: "회사 일정", color: "#FEEB00", icon: "Building2" },
  meeting: { label: "회의", color: "#3B82F6", icon: "Users" },
  other: { label: "기타", color: "#6B7280", icon: "Calendar" },
};
