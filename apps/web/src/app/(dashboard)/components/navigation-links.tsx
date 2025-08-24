"use client";

import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@workspace/ui/components/ui/navigation-menu";

interface NavigationLinksProps {
  workspaceId?: string;
}

export function NavigationLinks({ workspaceId }: NavigationLinksProps) {
  const pathname = usePathname();

  const navigationLinks = [
    { href: "/canvas", label: "Canvas" },
    { href: "/canvas/workflow", label: "Workflow" },
  ];

  // Helper function to check if link is active
  const isActiveLink = (href: string) => {
    if (href === "/canvas") {
      // Canvas 링크: /canvas 또는 /canvas/[workspaceId] 패턴 매칭
      return (
        pathname === "/canvas" ||
        (pathname.startsWith("/canvas/") && !pathname.includes("/workflow"))
      );
    }
    if (href === "/canvas/workflow") {
      // Workflow 링크: /canvas/workflow 또는 /canvas/[workspaceId]/workflow 패턴 매칭
      return pathname === "/canvas/workflow" || pathname.includes("/workflow");
    }
    return pathname === href || pathname.startsWith(href);
  };

  // 동적 라우팅을 위한 링크 생성 함수
  const getNavigationLink = (baseHref: string) => {
    if (workspaceId) {
      // workspaceId가 있으면 동적 라우팅 사용
      if (baseHref === "/canvas") {
        return `/canvas/${workspaceId}`;
      }
      if (baseHref === "/canvas/workflow") {
        return `/canvas/${workspaceId}/workflow`;
      }
    }
    // workspaceId가 없으면 현재 임시 라우팅 사용
    return baseHref;
  };

  return (
    <NavigationMenu className="max-w-none">
      <NavigationMenuList className="gap-2">
        {navigationLinks.map((link, index) => (
          <NavigationMenuItem key={index}>
            <NavigationMenuLink
              href={getNavigationLink(link.href)}
              className={`py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                isActiveLink(link.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-primary hover:bg-accent"
              }`}
            >
              {link.label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
