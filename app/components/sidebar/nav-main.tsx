"use client"

import { UserRoundPlus, type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar"
import { useRouter, usePathname } from "next/navigation"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  tooltip={item.title} 
                  asChild
                  isActive={isActive}
                >
                  <button
                    type="button"
                    onClick={() => router.push(item.url)}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}

          <SidebarMenuItem>
            <SidebarMenuButton 
              tooltip="Create Pathway" 
              asChild
              isActive={pathname === '/CreatePathway'}
            >
                <button
                type="button"
                onClick={() => router.push('/CreatePathway')}
                className={`flex items-center gap-2 w-full text-left ${pathname === '/CreatePathway' ? '!text-white' : 'text-white'} hover:text-white active:text-white !bg-green-600 hover:!bg-green-700 active:!bg-green-800 !border-green-600 focus-visible:!ring-2 focus-visible:!ring-green-300`}
              >
                <UserRoundPlus />
                <span>Create Pathway</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}