"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Crown, Users, Copy, Check, Loader2 } from "lucide-react"
import { gameService, teams, type GameRoom } from "@/lib/game-service"
import { useToast } from "@/hooks/use-toast"

interface GameLobbyProps {
  gameData: any
  user: any
  onStartGame: () => void
  onBack: () => void
}

export default function GameLobby({ gameData, user, onStartGame, onBack }: GameLobbyProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = gameService.subscribeToRoom(gameData.id, (roomData) => {
      setRoom(roomData)
      if (roomData?.status === "auction") {
        onStartGame()
      }
    })

    return unsubscribe
  }, [gameData.id, onStartGame])

  const copyRoomId = () => {
    navigator.clipboard.writeText(gameData.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Room ID Copied",
      description: "Share this ID with your friends to join the room",
    })
  }

  const handleTeamSelection = async (teamId: string) => {
    if (selectedTeam === teamId) {
      setSelectedTeam(null)
      return
    }

    setLoading(true)
    try {
      await gameService.selectTeam(gameData.id, user.id, teamId)
      setSelectedTeam(teamId)
      toast({
        title: "Team Selected",
        description: `You have selected ${teams.find((t) => t.id === teamId)?.name}`,
      })
    } catch (error: any) {
      toast({
        title: "Failed to Select Team",
        description: error.message,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleStartAuction = async () => {
    setLoading(true)
    try {
      await gameService.startAuction(gameData.id)
      toast({
        title: "Auction Started",
        description: "Let the bidding begin!",
      })
    } catch (error: any) {
      toast({
        title: "Failed to Start Auction",
        description: error.message,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  const isHost = user.id === room.hostId
  const players = Object.values(room.players)
  const allPlayersReady = players.every((p) => p.isReady && p.team)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-800">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Game Lobby</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-white/20 text-white">
              Room ID: {gameData.id}
            </Badge>
            <Button variant="ghost" size="sm" onClick={copyRoomId} className="text-white hover:bg-white/10">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Team Selection */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Select Your Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {teams.map((team) => {
                    const isSelected = selectedTeam === team.id
                    const isTaken = players.some((p) => p.team === team.id && p.id !== user.id)

                    return (
                      <div
                        key={team.id}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-orange-500 bg-orange-500/20"
                            : isTaken
                              ? "border-gray-500 bg-gray-500/20 opacity-50 cursor-not-allowed"
                              : "border-white/30 bg-white/5 hover:bg-white/10"
                        }`}
                        onClick={() => !isTaken && !loading && handleTeamSelection(team.id)}
                      >
                        <div className="text-center">
                          <img
                            src={team.logo || "/placeholder.svg"}
                            alt={team.name}
                            className="w-16 h-16 mx-auto mb-2 object-contain bg-white rounded-full p-1"
                          />
                          <h3 className="text-white text-sm font-medium">{team.name}</h3>
                          {isTaken && (
                            <Badge variant="secondary" className="mt-2 bg-red-600 text-white">
                              Taken
                            </Badge>
                          )}
                          {isSelected && (
                            <Badge variant="secondary" className="mt-2 bg-green-600 text-white">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Players List */}
          <div>
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Players ({players.length}/15)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {players.map((player) => {
                    const playerTeam = teams.find((t) => t.id === player.team)
                    return (
                      <div key={player.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                        <Avatar>
                          <AvatarImage src={player.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gray-600 text-white">{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{player.name}</span>
                            {player.id === room.hostId && <Crown className="w-4 h-4 text-yellow-500" />}
                          </div>
                          {playerTeam ? (
                            <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                              {playerTeam.name}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-600 text-white text-xs">
                              Selecting team...
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Game Rules */}
            <Card className="mt-6 bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Game Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-white/80 text-sm space-y-2">
                  <li>• Each team gets ₹100 crores budget</li>
                  <li>• Maximum 25 players per squad</li>
                  <li>• Maximum 8 overseas players</li>
                  <li>• Minimum bid increment: ₹10 lakhs</li>
                  <li>• 30 seconds per bidding round</li>
                  <li>• Unsold players return in accelerated auction</li>
                </ul>
              </CardContent>
            </Card>

            {/* Start Game Button */}
            {isHost && (
              <div className="mt-6">
                <Button
                  onClick={handleStartAuction}
                  disabled={!allPlayersReady || loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {allPlayersReady ? "Start Auction" : "Waiting for players..."}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
