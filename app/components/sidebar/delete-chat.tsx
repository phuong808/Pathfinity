"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface Chat {
  id: string;
  title: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat?: Chat | null;
  onConfirm: (chatId: string) => void;
}

export function DeleteAlert({ open, onOpenChange, chat, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Delete chat</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{chat?.title ?? "New Chat"}"? This action cannot be undone. All messages in this chat will be permanently removed.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
            <Button
              className="hover:bg-destructive active:bg-destructive"
              onClick={() => chat && onConfirm(chat.id)}
            >
              Delete
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}