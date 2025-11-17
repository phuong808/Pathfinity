"use client"

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"
import { MoreVertical, Edit, Trash2 } from "lucide-react"

type Props = {
  onEdit: () => void
  onDelete: () => void
}

export default function ProfileCardOptions({ onEdit, onDelete }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent sideOffset={8}>
        {/*
        <DropdownMenuItem onSelect={() => onEdit()}>
          <Edit className="size-4 mr-2" />
          Edit
        </DropdownMenuItem>
        */}

        <DropdownMenuItem data-variant="destructive" onSelect={() => onDelete()}>
          <Trash2 className="size-4 mr-2 text-destructive" />
          <span className="text-destructive">Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
