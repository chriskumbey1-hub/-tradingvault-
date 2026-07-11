"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Search, LogOut, User, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  onLogout?: () => void;
  onMenuToggle?: () => void;
}

export function Navbar({ user, onLogout, onMenuToggle }: NavbarProps) {
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <header className="flex h-14 items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 px-3 sm:px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-9 w-9"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center gap-2">
        <div className="relative hidden sm:block max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            placeholder="Search trades..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-800/50 py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden h-9 w-9"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {searchOpen && (
        <div className="absolute left-0 top-14 z-50 w-full border-b border-zinc-800 bg-zinc-900 p-3 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              placeholder="Search trades..."
              autoFocus
              className="w-full rounded-lg border border-zinc-800 bg-zinc-800/50 py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-zinc-700">
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "TV"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || "Trader"}
                </p>
                <p className="text-xs leading-none text-zinc-500">
                  {user?.email || "trader@example.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
