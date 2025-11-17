"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { SidebarMenuAction } from "../ui/sidebar";

interface Chat {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  chat: Chat;
  onRename: (chatId: string, currentTitle: string | null) => void;
  onDelete: (chat: Chat, e: React.MouseEvent<HTMLElement>) => void;
}

export function ChatDropdown({ chat, onRename, onDelete }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction showOnHover>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="right" align="start">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onRename(chat.id, chat.title);
          }}
        >
          <Pencil className="h-4 w-4" />
          Rename
        </DropdownMenuItem>

        <DropdownMenuItem
          variant="destructive"
          onClick={(e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(chat, e);
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}