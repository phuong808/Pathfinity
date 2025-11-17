"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface Chat {
  id: string;
  title: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat?: Chat | null;
  onConfirm: (chatId: string, newTitle: string) => void;
}

export function RenameDialog({ open, onOpenChange, chat, onConfirm }: Props) {
  const [value, setValue] = React.useState<string>(chat?.title ?? "New Chat");

  React.useEffect(() => {
    setValue(chat?.title ?? "New Chat");
  }, [chat]);

  const handleConfirm = () => {
    if (!chat) return;
    const trimmed = value.trim();
    if (trimmed === "") return;
    onConfirm(chat.id, trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Rename chat</DialogTitle>
          <DialogDescription>Enter a new name for this chat.</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Chat title"
            aria-label="Chat title"
            autoFocus
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleConfirm}
            className="ml-2"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}