import {
  LayoutDashboard,
  Sunrise,
  MessageSquareText,
  FileText,
  CreditCard,
  Calculator,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Brain,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { type UserRole, hasMinimumRole } from "@/types/auth.types";

export interface MenuChild {
  title: string;
  url: string;
  disabled?: boolean;
}

export interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  minRole: UserRole;
  disabled?: boolean;
  children?: MenuChild[];
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

// ─────────────────────────────────────────────
// 메뉴 그룹 정의 (3그룹)
// ─────────────────────────────────────────────

export const MENU_GROUPS: MenuGroup[] = [
  {
    label: "핵심",
    items: [
      {
        title: "대시보드",
        url: "/dashboard",
        icon: LayoutDashboard,
        minRole: "normal",
      },
      {
        title: "데일리 스크럼",
        url: "/scrum",
        icon: Sunrise,
        minRole: "normal",
      },
      {
        title: "TASK",
        url: "/tasks",
        icon: CheckSquare,
        minRole: "normal",
      },
      {
        title: "프로젝트",
        url: "/projects",
        icon: FolderKanban,
        minRole: "normal",
      },
      {
        title: "일정",
        url: "/schedule",
        icon: CalendarDays,
        minRole: "normal",
      },
    ],
  },
  {
    label: "지원",
    items: [
      {
        title: "회고",
        url: "/retrospective",
        icon: MessageSquareText,
        minRole: "normal",
        children: [
          { title: "사용가이드", url: "/retrospective/guide" },
          { title: "스프린트", url: "/retrospective/sprint" },
          { title: "포스트모템", url: "/retrospective/postmortem" },
        ],
      },
      {
        title: "회의록",
        url: "/meetings",
        icon: FileText,
        minRole: "normal",
        children: [
          { title: "전체 회의록", url: "/meetings" },
          { title: "액션아이템", url: "/meetings/action-items" },
        ],
      },
      {
        title: "입금/결제",
        url: "/payments",
        icon: CreditCard,
        minRole: "normal",
        children: [
          { title: "결제", url: "/payments" },
          { title: "대량전송", url: "/payments/bulk-download", disabled: true },
          { title: "계산서", url: "/payments/invoice", disabled: true },
        ],
      },
      {
        title: "견적서",
        url: "/estimates",
        icon: Calculator,
        minRole: "normal",
        children: [
          { title: "심플 견적", url: "/estimates" },
          { title: "동시견적 확인", url: "/estimates/collab" },
        ],
      },
      {
        title: "클라이언트 예측",
        url: "/predict",
        icon: Brain,
        minRole: "manager",
      },
    ],
  },
  {
    label: "설정",
    items: [
      {
        title: "설정",
        url: "/settings",
        icon: Settings,
        minRole: "boss",
      },
    ],
  },
];

// ─────────────────────────────────────────────
// 역할 기반 필터링
// ─────────────────────────────────────────────

export function getFilteredMenuGroups(role: UserRole): MenuGroup[] {
  return MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasMinimumRole(role, item.minRole)),
  })).filter((group) => group.items.length > 0);
}

// ─────────────────────────────────────────────
// 하위 호환성 — 기존 코드가 사용하는 flat 배열
// ─────────────────────────────────────────────

export const MENU_ITEMS: MenuItem[] = MENU_GROUPS.flatMap(
  (group) => group.items
);

export function getFilteredMenuItems(role: UserRole): MenuItem[] {
  return MENU_ITEMS.filter((item) => hasMinimumRole(role, item.minRole));
}
