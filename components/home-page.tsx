"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Users, Wifi, Loader2 } from "lucide-react"
import { gameService } from "@/lib/game-service"
import { useToast } from "@/hooks/use-toast"

interface HomePageProps {
  user: any
  onCreateRoom: (roomData: any) => void
  onJoinRoom: (roomData: any) => void
}

export default function HomePage({ user, onCreateRoom, onJoinRoom }: HomePageProps) {
  const [roomName, setRoomName] = useState("")
  const [roomId, setRoomId] = useState("")
  const [loading, setLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const { toast } = useToast()

  const iplTeamLogos = [
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/1200px-Mumbai_Indians_Logo.svg.png",
    "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Royal_Challengers_Bengaluru_Logo.svg/1200px-Royal_Challengers_Bengaluru_Logo.svg.png",
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Kolkata_Knight_Riders_Logo.svg/1200px-Kolkata_Knight_Riders_Logo.svg.png",
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/Delhi_Capitals.svg/1200px-Delhi_Capitals.svg.png",
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Chennai_Super_Kings_Logo.svg/1200px-Chennai_Super_Kings_Logo.svg.png",
    "https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg/1200px-This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg.png",
    "https://upload.wikimedia.org/wikipedia/en/thumb/5/51/Sunrisers_Hyderabad_Logo.svg/1200px-Sunrisers_Hyderabad_Logo.svg.png",
  ]

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast({
        title: "Room Name Required",
        description: "Please enter a room name",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const newRoomId = await gameService.createRoom(roomName, user.id, user.name, user.email)

      toast({
        title: "Room Created",
        description: `Room "${roomName}" created successfully!`,
      })

      onCreateRoom({
        id: newRoomId,
        name: roomName,
        hostId: user.id,
      })

      setCreateDialogOpen(false)
      setRoomName("")
    } catch (error: any) {
      toast({
        title: "Failed to Create Room",
        description: error.message,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      toast({
        title: "Room ID Required",
        description: "Please enter a room ID",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await gameService.joinRoom(roomId, user.id, user.name, user.email)

      toast({
        title: "Joined Room",
        description: "Successfully joined the room!",
      })

      onJoinRoom({
        id: roomId,
        name: "Joined Room",
      })

      setJoinDialogOpen(false)
      setRoomId("")
    } catch (error: any) {
      toast({
        title: "Failed to Join Room",
        description: error.message,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-800">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/placeholder-hes4w.png" alt="IPL Auction" className="w-10 h-10 rounded-full" />
            <h1 className="text-2xl font-bold text-white">IPL AUCTION</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-orange-600 text-white">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-white font-medium">{user.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* IPL Teams Carousel */}
        <Card className="mb-8 bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">IPL Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex overflow-x-auto space-x-4 pb-4">
              {iplTeamLogos.map((logo, index) => (
                <div key={index} className="flex-shrink-0">
                  <img
                    src={logo || "/placeholder.svg"}
                    alt={`IPL Team ${index + 1}`}
                    className="w-20 h-20 object-contain bg-white rounded-full p-2 hover:scale-110 transition-transform cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Create Room */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Create Room</h3>
              <p className="text-white/80 mb-6">Start a new IPL auction with your friends</p>

              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">Create New Room</Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create Auction Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="room-name" className="text-white">
                        Room Name
                      </Label>
                      <Input
                        id="room-name"
                        placeholder="Enter room name"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        disabled={loading}
                      />
                    </div>
                    <Button
                      onClick={handleCreateRoom}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Create Room
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Join Room</h3>
              <p className="text-white/80 mb-6">Join an existing auction room</p>

              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-white/30 text-white hover:bg-white/10 bg-transparent"
                  >
                    Join Existing Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Join Auction Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="room-id" className="text-white">
                        Room ID
                      </Label>
                      <Input
                        id="room-id"
                        placeholder="Enter room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        disabled={loading}
                      />
                    </div>
                    <Button
                      onClick={handleJoinRoom}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Join Room
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Nearby Rooms */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Wifi className="w-5 h-5 mr-2" />
              Nearby Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center text-white/60 py-8">
                <p>No nearby rooms found</p>
                <p className="text-sm">Create a room or join with a room ID</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
