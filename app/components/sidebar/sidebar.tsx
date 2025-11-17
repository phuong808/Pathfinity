"use client"

import * as React from "react"
import { Infinity, MessagesSquare, Map, GraduationCap, User, BookOpen } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { ChatHistory } from "./chat-history"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from "../ui/sidebar"

const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "Chat",
            url: "/Chat",
            icon: MessagesSquare,
        },
        /*
        {
            title: "Catalog",
            url: "/Catalog",
            icon: BookOpen,
        },
        {
          title: "Roadmap Viewer",
          url: "/SavedRoadmaps",
          icon: GraduationCap,
        },
        */
        {
          title: "Roadmaps",
          url: "/Roadmaps",
          icon: Map,
        },
        {
            title: "Mentors",
            url: "/Mentors",
            icon: User,
        }
    ],
}



export function ChatSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { data: session } = useSession()
    const router = useRouter()
    const { state, isMobile } = useSidebar()

    const user = session?.user
        ? {
            name: session.user.name,
            email: session.user.email,
            avatar: session.user.image ?? "/avatars/default.jpg",
        }
        : null

    return (
        <>
          <Sidebar collapsible="icon" className="group/sidebar-hover" {...props}>
            <SidebarHeader className="relative">
              <SidebarMenu>
                <SidebarMenuItem>
                  <div className="flex items-center justify-between w-full">
                    <SidebarMenuButton
                      asChild
                      className="data-[slot=sidebar-menu-button]:!p-1.5 flex-1"
                    >
                      <button
                        type="button"
                        onClick={() => router.push('/Chat')}
                        className="flex items-center gap-2"
                      >
                        <Infinity className="h-5 w-5" />
                        <span className="text-base font-semibold">Pathfinity</span>
                      </button>
                    </SidebarMenuButton>
                    
                    {/* Toggle button - visible when expanded or on hover over sidebar when collapsed on desktop */}
                    {!isMobile && (
                      <SidebarTrigger
                        className={`${
                          state === "collapsed" 
                            ? "opacity-0 group-hover/sidebar-hover:opacity-100 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-sidebar hover:bg-sidebar-accent rounded-md" 
                            : "opacity-100 relative"
                        } transition-opacity duration-200`}
                      />
                    )}
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
              <NavMain items={data.navMain} />
              <ChatHistory userId={session?.user?.id} />
            </SidebarContent>

            <SidebarFooter>
              <NavUser user={user} />
            </SidebarFooter>
          </Sidebar>

          {/* Mobile trigger - always visible, positioned fixed */}
          {isMobile && (
            <SidebarTrigger className="fixed top-4 left-4 z-50 bg-sidebar" />
          )}
        </>
    )
}