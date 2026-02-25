"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SettingsNav() {
  const pathname = usePathname();
  const tabs = [
    { label: "계정 관리", href: "/settings/users" },
    { label: "변경 이력", href: "/settings/logs" },
  ];

  return (
    <div className="flex gap-2 border-b pb-4 mb-6">
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href}>
          <Button variant={pathname === tab.href ? "default" : "ghost"}>
            {tab.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}
