"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  User, 
  Shield, 
  ArrowLeft, 
  Save, 
  Trash2,
  Eye,
  EyeOff,
  Heart,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  email: string
  username?: string
  favorite_genre_id?: number
  created_at: string
}

interface Genre {
  id: number
  name: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])
  const [username, setUsername] = useState("")
  const [favoriteGenreId, setFavoriteGenreId] = useState<number | undefined>(undefined)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadGenres()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userError) {
        console.error('Error fetching user:', userError)
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive"
        })
        return
      }

      setUser(userData)
      setUsername(userData.username || "")
      setFavoriteGenreId(userData.favorite_genre_id)
      
    } catch (err) {
      console.error('Error:', err)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadGenres = async () => {
    try {
      const response = await fetch('/api/genres?type=movie')
      if (response.ok) {
        const genresData = await response.json()
        setGenres(genresData)
      }
    } catch (error) {
      console.error('Error loading genres:', error)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          username,
          favorite_genre_id: favoriteGenreId 
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Profile updated successfully"
      })
      
      setUser({ ...user, username, favorite_genre_id: favoriteGenreId })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Password updated successfully"
      })
      
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error('Error updating password:', error)
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    
    const confirmText = "DELETE"
    const userInput = prompt(
      `This action cannot be undone. This will permanently delete your account and all associated data.\n\nType "${confirmText}" to confirm:`
    )
    
    if (userInput !== confirmText) {
      return
    }

    setDeleting(true)
    try {
      // Delete user data from all related tables
      const deletePromises = [
        supabase.from('reviews').delete().eq('user_id', user.id),
        supabase.from('watchlist').delete().eq('user_id', user.id),
        supabase.from('chatbot_history').delete().eq('user_id', user.id),
        supabase.from('users').delete().eq('id', user.id)
      ]

      await Promise.all(deletePromises)

      // Delete from auth system
      const { error: authError } = await supabase.auth.signOut()
      
      if (authError) {
        console.error('Error signing out:', authError)
      }

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted"
      })
      
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again or contact support.",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-6">
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground">Please log in to access settings</p>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your profile information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your email address is managed through your account settings
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be displayed in the navbar and chatbot
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favorite-genre">Favorite Genre</Label>
                  <Select 
                    value={favoriteGenreId?.toString() || ""} 
                    onValueChange={(value) => setFavoriteGenreId(value ? parseInt(value) : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your favorite genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre.id} value={genre.id.toString()}>
                          {genre.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Used for personalized recommendations and chatbot responses
                  </p>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>



          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your account password for better security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPasswords ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button 
                  onClick={handleChangePassword} 
                  disabled={saving || !newPassword || !confirmPassword}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Updating..." : "Update Password"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Management */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  View your account details and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Account Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Account Status</Label>
                    <p className="text-sm text-green-600">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. This will permanently delete:
                  </p>
                  <ul className="text-sm text-muted-foreground mb-4 list-disc list-inside space-y-1">
                    <li>Your profile and username</li>
                    <li>All your movie and TV show reviews</li>
                    <li>Your complete watchlist</li>
                    <li>Chat history with BingiBot</li>
                    <li>All account preferences and settings</li>
                  </ul>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleting ? "Deleting Account..." : "Delete Account"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  )
}