"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  MessageSquare,
  BookOpen,
  FileText,
  Lightbulb,
  ShieldCheck,
  Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "CRM",
    items: [
      {
        label: "Clients",
        href: "/clients",
        icon: Users,
      },
      {
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
      },
    ],
  },
  {
    title: "Feedback",
    items: [
      {
        label: "Feedback",
        href: "/feedback",
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Integrations",
    items: [
      {
        label: "Integrations",
        href: "/integrations",
        icon: Plug,
      },
    ],
  },
  {
    title: "Knowledge Base",
    items: [
      {
        label: "Rules",
        href: "/kb/rules",
        icon: ShieldCheck,
      },
      {
        label: "Patterns",
        href: "/kb/patterns",
        icon: Lightbulb,
      },
      {
        label: "Documents",
        href: "/kb/documents",
        icon: FileText,
      },
      {
        label: "Search",
        href: "/kb/search",
        icon: BookOpen,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/40 md:block">
      <nav className="flex h-full flex-col gap-2 p-4">
        {navigation.map((section) => (
          <div key={section.title} className="mb-2">
            <h4 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h4>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
