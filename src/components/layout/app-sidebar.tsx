"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChevronRight } from "lucide-react";
import { type UserProfile } from "@/types/auth.types";
import { getFilteredMenuItems, type MenuItem } from "@/lib/constants";
import { signOut } from "@/actions/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppSidebarProps {
  user: UserProfile;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const menuItems = getFilteredMenuItems(user.role);

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/dashboard" className="flex items-center justify-center">
          <Image
            src="/logo.svg"
            alt="GRIFF-Q"
            width={96}
            height={18}
            className="dark:invert"
            priority
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) =>
                item.children ? (
                  <Collapsible
                    key={item.url}
                    defaultOpen={pathname.startsWith(item.url)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={pathname.startsWith(item.url)}
                        >
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.url}>
                              {child.disabled ? (
                                <SidebarMenuSubButton
                                  className="opacity-40 pointer-events-none"
                                >
                                  <span>{child.title}</span>
                                  <span className="ml-auto text-[10px] text-muted-foreground">v0.3</span>
                                </SidebarMenuSubButton>
                              ) : (
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === child.url || pathname.startsWith(child.url + "/")}
                                >
                                  <Link href={child.url}>
                                    <span>{child.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              )}
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : item.disabled ? (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      className="opacity-40 pointer-events-none"
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">v0.3</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.url)}
                    >
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">
                  {user.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {user.role}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
