"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Menu, X, Film, User, LogOut, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabaseClient"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Movies", href: "/movies" },
    { name: "TV Shows", href: "/tv" },
    { name: "Genres", href: "/genres" },
    { name: "Watchlist", href: "/watchlist", icon: Bookmark },
  ]

  const authItems = user 
    ? [
        { name: "Profile", href: "/profile", icon: User },
        { name: "Sign Out", href: "#", onClick: handleSignOut, icon: LogOut },
      ]
    : [
        { name: "Sign Up", href: "/signup" },
        { name: "Login", href: "/login" },
      ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsMenuOpen(false)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e)
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Film className="h-8 w-8 text-accent" />
            <span className="text-xl font-bold text-foreground">
              Movie <span className="text-accent">Inferno</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-accent transition-colors duration-200 font-medium flex items-center space-x-1"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.name}</span>
              </Link>
            ))}
            {!loading && authItems.map((item) => (
              item.onClick ? (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className="text-foreground hover:text-accent transition-colors duration-200 font-medium flex items-center space-x-1"
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.name}</span>
                </button>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-foreground hover:text-accent transition-colors duration-200 font-medium flex items-center space-x-1"
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.name}</span>
                </Link>
              )
            ))}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search movies, TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10 w-64 bg-input border-border focus:border-accent"
              />
            </form>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-border">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-foreground hover:text-accent transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.name}</span>
                  </div>
                </Link>
              ))}
              {!loading && authItems.map((item) => (
                item.onClick ? (
                  <button
                    key={item.name}
                    onClick={() => {
                      item.onClick?.()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 text-foreground hover:text-accent transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-2">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.name}</span>
                    </div>
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-2 text-foreground hover:text-accent transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.name}</span>
                    </div>
                  </Link>
                )
              ))}
              <div className="px-3 py-2">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-10 bg-input border-border focus:border-accent"
                  />
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
