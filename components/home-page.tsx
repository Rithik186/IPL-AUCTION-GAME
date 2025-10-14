"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Users, Loader2, Wifi, Settings, LogOut, Palette } from "lucide-react"
import { gameService, teams } from "@/lib/game-service"
import { useToast } from "@/hooks/use-toast"
import Silk from './Silk';
import TargetCursor from './TargetCursor';

interface HomePageProps {
  user: any
  onCreateRoom: (roomData: any) => void
  onJoinRoom: (roomData: any) => void
  onLogout: () => void
  onGoToGallery: () => void
}

export default function HomePage({ user, onCreateRoom, onJoinRoom, onLogout, onGoToGallery }: HomePageProps) {
  const [roomName, setRoomName] = useState("")
  const [roomId, setRoomId] = useState("")
  const [loading, setLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [themeColor, setThemeColor] = useState("#250932FF")
  const { toast } = useToast()

  const themes = [
    { name: "Red", color: "#FF0000FF" },
    { name: "Orange", color: "#FFA500FF" },
    { name: "Golden Yellow", color: "#FFD700FF" },
    { name: "Pink", color: "#FFC0CBFF" },
    { name: "Default", color: "#250932FF" },
  ]

  async function handleCreateRoom() {
    if (!roomName.trim()) {
      toast({ title: "Room Name Required", description: "Please enter a room name", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const newRoomId = await gameService.createRoom(roomName, user.id, user.name, user.email)
      toast({ title: "Room Created", description: `Room "${roomName}" created successfully!` })
      onCreateRoom({ id: newRoomId, name: roomName, hostId: user.id })
      setCreateDialogOpen(false)
      setRoomName("")
    } catch (e: any) {
      toast({ title: "Failed to Create Room", description: e.message, variant: "destructive" })
    }
    setLoading(false)
  }

  async function handleJoinRoom() {
    if (!roomId.trim()) {
      toast({ title: "Room ID Required", description: "Please enter a room ID", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      await gameService.joinRoom(roomId, user.id, user.name, user.email)
      toast({ title: "Joined Room", description: "Successfully joined the room!" })
      onJoinRoom({ id: roomId, name: "Joined Room" })
      setJoinDialogOpen(false)
      setRoomId("")
    } catch (e: any) {
      toast({ title: "Failed to Join Room", description: e.message, variant: "destructive" })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      <TargetCursor 
        spinDuration={2}
        hideDefaultCursor={true}
      />
      {/* background accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] rounded-full bg-amber-500/20 blur-3xl" />
        
        {/* Added Light component for background */}
<Silk
      speed={20}
      scale={0.9}
      color={themeColor}
      noiseIntensity={0.5}
      rotation={4}
  />
      </div>

      {/* header */}
      <header className="sticky top-0 z-10 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-amber-500 ring-2 ring-white/20" />
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">IPL Auction</h1>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <span className="truncate max-w-[120px] md:max-w-none text-white/80">{user?.name}</span>
            <Sheet>
              <SheetTrigger asChild>
                <button className="cursor-target">
                  <Avatar className="ring-2 ring-blue-400/40">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-blue-600 text-white">{user?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </button>
              </SheetTrigger>
              <SheetContent className="bg-slate-950/90 border-l border-white/10 text-white">
                <SheetHeader>
                  <SheetTitle className="text-white">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Settings className="h-5 w-5" />
                    Settings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-2" onClick={onLogout}>
                    <LogOut className="h-5 w-5" />
                    Logout
                  </Button>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-4">
                      <Palette className="h-5 w-5" />
                      <span>Themes</span>
                    </div>
                    <div className="flex flex-wrap gap-2 px-4">
                      {themes.map((theme) => (
                        <button
                          key={theme.name}
                          onClick={() => setThemeColor(theme.color)}
                          className="h-8 w-8 rounded-full border-2"
                          style={{
                            backgroundColor: theme.color.slice(0, 7),
                            borderColor: themeColor === theme.color ? "white" : "transparent",
                          }}
                          title={theme.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12 relative z-10">
        {/* hero */}
        <section className="text-center mb-8 md:mb-10">
          <h2 className="text-balance text-2xl md:text-4xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-blue-200 to-amber-200 bg-clip-text text-transparent">
              Build your dream squad in real‑time auctions
            </span>
          </h2>
          <p className="mt-3 text-slate-100/90">
            Instant rooms. Smooth bidding. Modern chat. Optimized for every screen.
          </p>
        </section>

        {/* team carousel */}
        <Card className="mb-8 bg-white/5 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-center text-slate-100">IPL Teams</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="flex overflow-x-auto py-4 space-x-6">
              {teams.map((team) => (
                <div key={team.id} className="flex-shrink-0 group will-change-transform cursor-target">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-white/5 border border-white/10 grid place-items-center transition-all duration-300 ease-in-out group-hover:bg-white/15 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-blue-500/20">
                    <img
                      src={team.logo || "/placeholder.svg"}
                      alt={team.name}
                      className="h-16 w-16 md:h-20 md:w-20 object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* actions */}
        <section className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* create */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition cursor-target">
            <CardContent className="p-5 md:p-6 text-center">
              <div className="mx-auto mb-5 md:mb-6 h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center">
                <Plus className="h-7 w-7 md:h-8 md:w-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-slate-100">Create Room</h3>
              <p className="text-slate-300 mb-5 md:mb-6">Host a new auction with friends</p>

              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 py-2.5 text-sm md:text-base">
                    Create New Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-950/90 border border-white/10 backdrop-blur-xl">
                  <DialogHeader>
                    <DialogTitle>Create Auction Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="room-name">Room Name</Label>
                      <Input
                        id="room-name"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Enter room name"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        disabled={loading}
                      />
                    </div>
                    <Button
                      onClick={handleCreateRoom}
                      disabled={loading}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Create Room
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* join */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition cursor-target">
            <CardContent className="p-5 md:p-6 text-center">
              <div className="mx-auto mb-5 md:mb-6 h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 grid place-items-center">
                <Users className="h-7 w-7 md:h-8 md:w-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-slate-100">Join Room</h3>
              <p className="text-slate-300 mb-5 md:mb-6">Enter a room ID to join</p>

              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent py-2.5 text-sm md:text-base"
                  >
                    Join Existing Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-950/90 border border-white/10 backdrop-blur-xl">
                  <DialogHeader>
                    <DialogTitle>Join Auction Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="room-id">Room ID</Label>
                      <Input
                        id="room-id"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Enter room ID"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        disabled={loading}
                      />
                    </div>
                    <Button
                      onClick={handleJoinRoom}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Join Room
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </section>

        {/* gallery */}
        <Card className="mt-8 md:mt-10 bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition cursor-target">
          <CardContent className="p-5 md:p-6 text-center">
            <h3
              className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-blue-200 transition-all duration-300 hover:from-amber-300 hover:to-blue-300 hover:scale-105"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              IPL DOME GALLERY
            </h3>
            <p className="text-lg md:text-xl text-slate-200 mb-6 transition-colors duration-300 hover:text-white">
              Explore the legends of the IPL
            </p>
            <Button
              onClick={onGoToGallery}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 text-lg"
            >
              Explore the Gallery
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
