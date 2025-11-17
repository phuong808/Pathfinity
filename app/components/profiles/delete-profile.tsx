"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile?: { id: number; career?: string } | null
  onConfirm: (id: number) => void
  confirmLabel?: string
}

export default function DeleteProfileDialog({ open, onOpenChange, profile, onConfirm, confirmLabel = 'Delete' }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Delete profile</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{profile?.career ?? 'this profile'}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button className="hover:bg-destructive active:bg-destructive" onClick={() => profile && onConfirm(profile.id)}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
