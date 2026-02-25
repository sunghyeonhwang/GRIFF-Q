import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { type UserProfile } from "@/types/auth.types";

interface AppHeaderProps {
  user: UserProfile;
}

export function AppHeader({ user: _user }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <span className="text-sm text-muted-foreground">GRIFF-Q</span>
    </header>
  );
}
