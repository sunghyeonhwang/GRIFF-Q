import {
  LayoutDashboard,
  MessageSquareText,
  FileText,
  CreditCard,
  Calculator,
  FolderKanban,
  Brain,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { type UserRole, hasMinimumRole } from "@/types/auth.types";

export interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  minRole: UserRole;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    title: "대시보드",
    url: "/dashboard",
    icon: LayoutDashboard,
    minRole: "normal",
  },
  {
    title: "회고",
    url: "/retrospective",
    icon: MessageSquareText,
    minRole: "normal",
  },
  { title: "회의록", url: "/meetings", icon: FileText, minRole: "normal" },
  { title: "입금/결제", url: "/payments", icon: CreditCard, minRole: "normal" },
  { title: "견적서", url: "/estimates", icon: Calculator, minRole: "normal" },
  {
    title: "프로젝트",
    url: "/projects",
    icon: FolderKanban,
    minRole: "normal",
  },
  {
    title: "클라이언트 예측",
    url: "/predict",
    icon: Brain,
    minRole: "manager",
  },
  { title: "설정", url: "/settings", icon: Settings, minRole: "boss" },
];

export function getFilteredMenuItems(role: UserRole): MenuItem[] {
  return MENU_ITEMS.filter((item) => hasMinimumRole(role, item.minRole));
}
