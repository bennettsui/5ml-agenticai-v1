"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { removeToken } from "@/lib/auth";

export function Header() {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    removeToken();
    router.push("/(auth)/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Logo / Brand */}
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-sm font-bold">CK</span>
        </div>
        <span className="hidden md:inline-block">CRM + KB</span>
      </Link>

      {/* Search */}
      <div className="ml-auto flex flex-1 items-center gap-4 md:ml-8 md:max-w-sm lg:max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients, projects, feedback..."
            className="w-full pl-8"
          />
        </div>
      </div>

      {/* Right-side actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            3
          </span>
        </Button>

        {/* User menu */}
        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden text-sm font-medium md:inline-block">
              Admin User
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
              <button
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                onClick={() => {
                  setUserMenuOpen(false);
                }}
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-accent"
                onClick={() => {
                  setUserMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
