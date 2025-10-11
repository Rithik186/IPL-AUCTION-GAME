"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Crown, Users, Copy, Check, Loader2, MessageCircle } from "lucide-react"
import { gameService, teams, type GameRoom } from "@/lib/game-service"
import { useToast } from "@/hooks/use-toast"
import ChatRoom from "@/components/chat-room"
import { chatService } from "@/lib/chat-service"

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
  const [showChat, setShowChat] = useState(false)
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

  if (showChat) {
    return <ChatRoom roomId={gameData.id} userId={user.id} userName={user.name} onBack={() => setShowChat(false)} />
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
    <div className="min-h-screen min-w-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -left-28 w-[420px] h-[420px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-28 -right-28 w-[460px] h-[460px] rounded-full bg-amber-500/20 blur-3xl" />
      </div>
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-slate-50 text-lg md:text-xl font-extrabold tracking-tight">Game Lobby</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowChat(true)}
              className="border-white/20 text-slate-100 hover:bg-white/10 bg-transparent"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Badge variant="secondary" className="bg-white/10 text-slate-100 border border-white/20">
              Room ID: {gameData.id}
            </Badge>
            <Button variant="ghost" size="sm" onClick={copyRoomId} className="text-white hover:bg-white/10">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Team Selection */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-slate-100 text-xl md:text-2xl font-bold">Select Your Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                  {teams.map((team) => {
                    const isSelected = selectedTeam === team.id
                    const isTaken = players.some((p) => p.team === team.id && p.id !== user.id)

                    return (
                      <div
                        key={team.id}
                        className={`group relative p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/15 shadow-md"
                            : isTaken
                              ? "border-slate-700 bg-slate-800/30 opacity-60 cursor-not-allowed"
                              : "border-white/10 bg-white/5 hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-lg"
                        }`}
                        onClick={() => !isTaken && !loading && handleTeamSelection(team.id)}
                      >
                        <div className="text-center min-w-0">
                          <div className="mx-auto mb-2 aspect-square w-14 md:w-16 rounded-xl bg-white grid place-items-center ring-1 ring-slate-200 group-hover:ring-amber-300 transition">
                            <img
                              src={team.logo || "/placeholder.svg"}
                              alt={team.name}
                              className="h-10 w-10 md:h-12 md:w-12 object-contain"
                            />
                          </div>
                          <h3 className="text-slate-50 text-xs md:text-sm font-semibold truncate">{team.name}</h3>
                          {isTaken ? (
                            <Badge variant="secondary" className="mt-2 bg-red-600 text-white text-xs">
                              Taken
                            </Badge>
                          ) : isSelected ? (
                            <Badge variant="secondary" className="mt-2 bg-emerald-600 text-white text-xs">
                              Selected
                            </Badge>
                          ) : null}
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
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-lg font-bold">
                  <Users className="w-5 h-5 mr-3 text-purple-300" />
                  Players ({players.length}/15)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {players.map((player) => {
                    const playerTeam = teams.find((t) => t.id === player.team)
                    return (
                      <div
                        key={player.id}
                        className="flex items-center gap-3 p-2.5 bg-white/5 rounded-md border border-white/10"
                      >
                        <Avatar className="ring-1 ring-blue-400/40">
                          <AvatarImage src={player.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-blue-600 text-white font-bold">
                            {player.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-slate-50 font-semibold truncate">{player.name}</span>
                            {player.id === room.hostId && <Crown className="w-4 h-4 text-yellow-400 shrink-0" />}
                          </div>
                          {playerTeam ? (
                            <Badge variant="secondary" className="mt-1 bg-emerald-600 text-white text-xs">
                              {playerTeam.name}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="mt-1 bg-slate-600 text-white text-xs">
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
            <Card className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white text-xl font-bold">Game Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-slate-100/90 space-y-2.5 text-sm md:text-base">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Each team gets ₹120 crores budget
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Maximum 25 players per squad
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Maximum 8 overseas players
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Dynamic bid increments
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    15 seconds per bidding round
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Point-based final leaderboard
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Start Game Button */}
            {isHost && (
              <div className="mt-6 md:mt-8">
                <Button
                  onClick={handleStartAuction}
                  disabled={!allPlayersReady || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 py-2.5 md:py-3 text-sm md:text-base font-bold rounded-lg"
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
