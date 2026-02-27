"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MENU_ITEMS } from "@/lib/constants";
import { Fragment } from "react";

const LABEL_MAP: Record<string, string> = {};

// Build label map from MENU_ITEMS
for (const item of MENU_ITEMS) {
  const seg = item.url.split("/").filter(Boolean).pop();
  if (seg) LABEL_MAP[seg] = item.title;
  if (item.children) {
    for (const child of item.children) {
      const childSeg = child.url.split("/").filter(Boolean).pop();
      if (childSeg) LABEL_MAP[childSeg] = child.title;
    }
  }
}

// Additional known segments
Object.assign(LABEL_MAP, {
  new: "신규 작성",
  edit: "수정",
  guide: "사용가이드",
  sprint: "스프린트",
  postmortem: "포스트모템",
  summary: "요약",
  "action-items": "액션아이템",
  "bulk-download": "대량전송",
  invoice: "계산서",
  collab: "동시견적 확인",
  templates: "템플릿",
  avatars: "아바타",
  chat: "채팅",
  upload: "업로드",
  users: "사용자 관리",
  logs: "감사 로그",
  review: "리뷰",
  compare: "비교",
  search: "검색",
  import: "가져오기",
});

function isUuid(segment: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
}

function isNumericId(segment: string): boolean {
  return /^\d+$/.test(segment);
}

export function BreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;

    let label: string;
    if (isUuid(segment) || isNumericId(segment)) {
      label = "상세";
    } else {
      label = LABEL_MAP[segment] || segment;
    }

    return { label, href, isLast };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.href}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href}>
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
