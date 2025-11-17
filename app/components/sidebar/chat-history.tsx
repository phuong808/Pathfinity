"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getChats, deleteChat, updateChatTitle } from "@/app/db/actions";
import { cn } from "@/lib/utils";
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "../ui/sidebar";
import { ChatDropdown } from "./chat-dropdown";
import { DeleteAlert } from "./delete-chat";
import { RenameDialog } from "./rename-chat";

interface Chat {
    id: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export function ChatHistory({
    userId,
    enabled = true,
}: {
    userId?: string;
    enabled?: boolean;
}) {
    const [chats, setChats] = React.useState<Chat[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = React.useState<boolean>(!!enabled);

    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [chatToDelete, setChatToDelete] = React.useState<Chat | null>(null);
    const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
    const [chatToRename, setChatToRename] = React.useState<Chat | null>(null);

    // Load chats on mount
    React.useEffect(() => {
        loadChats();
    }, [userId]);

    // Refresh chats when pathname changes (new chat or switching chats)
    React.useEffect(() => {
        loadChats();
    }, [pathname, userId]);

    // Poll for updates every 5 seconds when on a chat page
    React.useEffect(() => {
        if (pathname.startsWith("/Chat/") && userId) {
            const interval = setInterval(() => {
                loadChats();
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [pathname, userId]);

    const loadChats = async () => {
        // Don't load chats if userId is not available
        if (!userId) {
            setIsLoading(false);
            setChats([]);
            return;
        }

        try {
            const fetchedChats = await getChats(userId);
            setChats(fetchedChats);
        } catch (error) {
            console.error("Failed to load chats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const openDeleteDialog = (chat: Chat, e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        e.preventDefault();
        setChatToDelete(chat);
        setDeleteDialogOpen(true);
    };

    const openRenameDialog = (chatId: string, currentTitle: string | null) => {
        const existing =
            chats.find((c) => c.id === chatId) || {
                id: chatId,
                title: currentTitle,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        setChatToRename(existing);
        setRenameDialogOpen(true);
    };

    const performDeleteChat = async (chatId: string) => {
        try {
            await deleteChat(chatId);
            setChats((prev) => prev.filter((chat) => chat.id !== chatId));

            // If deleted the current chat, redirect to new chat
            if (pathname === `/Chat/${chatId}`) {
                router.push("/Chat");
            }
        } catch (error) {
            console.error("Failed to delete chat:", error);
        } finally {
            setDeleteDialogOpen(false);
            setChatToDelete(null);
        }
    };

    const performRenameChat = async (chatId: string, newTitle: string) => {
        try {
            await updateChatTitle(chatId, newTitle);
            setChats((prev) =>
                prev.map((chat) => (chat.id === chatId ? { ...chat, title: newTitle } : chat))
            );
        } catch (error) {
            console.error("Failed to rename chat:", error);
        } finally {
            setRenameDialogOpen(false);
            setChatToRename(null);
        }
    };

    if (isLoading) {
        return (
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                <div
                    className={cn(
                        "w-full text-left flex items-center justify-between px-2 py-2 rounded",
                        "cursor-default"
                    )}
                    aria-busy
                >
                    <div className="flex items-center gap-2"></div>
                </div>
            </SidebarGroup>
        );
    }

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <button
                type="button"
                aria-expanded={open}
                aria-controls="chat-history-list"
                onClick={() => enabled && setOpen((v) => !v)}
                className={cn(
                    "w-full text-left flex items-center justify-between px-2 py-2 rounded",
                    !enabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
                )}
                title={enabled ? (open ? "Collapse" : "Expand") : "Disabled"}
                disabled={!enabled}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Chat History</span>
                </div>
                <span aria-hidden className="pointer-events-none">
                    <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
                </span>
            </button>

            <SidebarMenu>
                <div
                    id="chat-history-list"
                    className={cn("max-h-[400px] overflow-y-auto overflow-x-hidden", !open && "hidden")}
                >
                    {chats.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-muted-foreground">No conversations yet</div>
                    ) : (
                        chats.map((chat) => {
                            const isActive = pathname === `/Chat/${chat.id}`;
                            return (
                                <SidebarMenuItem key={chat.id}>
                                    <SidebarMenuButton asChild isActive={isActive} className={cn("w-full justify-start")}>
                                        <button
                                            type="button"
                                            onClick={() => router.push(`/Chat/${chat.id}`)}
                                            className="flex items-center gap-2 w-full text-left"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className="truncate text-sm font-muted"
                                                    title={chat.title ?? "New Chat"}
                                                    aria-label={chat.title ?? "New Chat"}
                                                >
                                                    {chat.title ?? "New Chat"}
                                                </div>
                                            </div>
                                        </button>
                                    </SidebarMenuButton>

                                    <ChatDropdown chat={chat} onRename={openRenameDialog} onDelete={openDeleteDialog} />
                                </SidebarMenuItem>
                            );
                        })
                    )}
                </div>
            </SidebarMenu>

            <DeleteAlert
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                chat={chatToDelete}
                onConfirm={performDeleteChat}
            />
            <RenameDialog
                open={renameDialogOpen}
                onOpenChange={setRenameDialogOpen}
                chat={chatToRename}
                onConfirm={performRenameChat}
            />
        </SidebarGroup>
    );
}
