"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

export function PostmortemCreateButton({
  projects,
}: {
  projects: Project[];
}) {
  const router = useRouter();

  if (projects.length === 0) {
    return (
      <Button disabled>
        <Plus className="mr-2 size-4" />
        포스트모템 작성
      </Button>
    );
  }

  if (projects.length === 1) {
    return (
      <Button
        onClick={() =>
          router.push(`/projects/${projects[0].id}/postmortem`)
        }
      >
        <Plus className="mr-2 size-4" />
        포스트모템 작성
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          포스트모템 작성
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() =>
              router.push(`/projects/${project.id}/postmortem`)
            }
          >
            {project.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
