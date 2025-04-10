"use client"

import type React from "react"
import { useState, useEffect, useLayoutEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import dynamic from "next/dynamic"
import Image from "next/image"
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  User,
  CreditCard,
  BarChart,
  Newspaper,
  Home,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { NetworkStatus } from "@/components/ui/network-status"

// Dynamically import components that might cause hydration issues
const NotificationsDropdown = dynamic(
  () => import("@/components/notifications/notifications-dropdown").then(mod => mod.NotificationsDropdown),
  { ssr: false }
)

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { logout } = useAuth() // Use the auth context
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check if mobile on mount and when window resizes
  useLayoutEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    if (typeof window !== 'undefined') {
      checkIfMobile()
      window.addEventListener("resize", checkIfMobile)
      return () => window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      // Use the logout function from auth context
      await logout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  // Navigation items
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/dashboard/events", label: "Acara", icon: <Calendar className="h-5 w-5" /> },
    { href: "/dashboard/members", label: "Anggota", icon: <Users className="h-5 w-5" /> },
    { href: "/dashboard/finance", label: "Keuangan", icon: <CreditCard className="h-5 w-5" /> },
    { href: "/dashboard/reports", label: "Laporan", icon: <BarChart className="h-5 w-5" /> },
    { href: "/dashboard/news", label: "Berita", icon: <Newspaper className="h-5 w-5" /> },
    { href: "/dashboard/documents", label: "Dokumen", icon: <FileText className="h-5 w-5" /> },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-lg transition-all duration-300 lg:relative lg:z-auto ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isSidebarCollapsed ? "w-20" : "w-64"}`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            {!isSidebarCollapsed && (
              <>
                <Image
                  src="/images/opn-logo.png"
                  alt="OPN Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="text-lg font-bold">OPN Admin</span>
              </>
            )}
            {isSidebarCollapsed && (
              <Image
                src="/images/opn-logo.png"
                alt="OPN Logo"
                width={32}
                height={32}
                className="h-8 w-8 mx-auto"
              />
            )}
          </Link>
          <div className="flex items-center lg:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="hidden lg:flex">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              {isSidebarCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Sidebar content */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-700 hover:bg-gray-100"
                } ${isSidebarCollapsed ? "justify-center" : "justify-start"}`}
              >
                {item.icon}
                {!isSidebarCollapsed && <span className="ml-3">{item.label}</span>}
              </Link>
            ))}
          </nav>
        </ScrollArea>

        {/* Sidebar footer */}
        <div className="border-t p-4">
          <Link
            href="/dashboard/settings"
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 ${
              isSidebarCollapsed ? "justify-center" : "justify-start"
            }`}
          >
            <Settings className="h-5 w-5" />
            {!isSidebarCollapsed && <span className="ml-3">Pengaturan</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex flex-1 flex-col ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleMobileMenu}>
              <Menu className="h-6 w-6" />
            </Button>
            <form onSubmit={handleSearch} className="ml-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Cari..."
                  className="w-64 pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
            {isClient && <NotificationsDropdown />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/images/avatar.png" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Pengaturan</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/help")}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Bantuan</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 px-4 py-8">
          {children}
        </main>

        {/* Status indicators */}
        <NetworkStatus />
      </div>
    </div>
  )
}
