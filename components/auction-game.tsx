"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Timer,
  TrendingUp,
  UsersIcon,
  Loader2,
  Trophy,
  Crown,
  Sparkles,
  MessageCircle,
  Volume2,
  VolumeX,
} from "lucide-react"
import { gameService, teams, type GameRoom } from "@/lib/game-service"
import { playersDatabase } from "@/lib/players-data"
import { useToast } from "@/hooks/use-toast"
import Confetti from "./confetti"
import ChatRoom from "./chat-room"

interface AuctionGameProps {
  gameData: any
  user: any
  onBack: () => void
}

export default function AuctionGame({ gameData, user, onBack }: AuctionGameProps) {
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [loading, setLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showSoldOverlay, setShowSoldOverlay] = useState(false)
  const [showUnsoldOverlay, setShowUnsoldOverlay] = useState(false)
  const [showMyTeam, setShowMyTeam] = useState(false)
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false)
  const [soldPlayerData, setSoldPlayerData] = useState<{
    player: any
    price: number
    buyerName: string
  } | null>(null)
  const [unsoldPlayerData, setUnsoldPlayerData] = useState<any>(null)
  const [showRoundTransition, setShowRoundTransition] = useState(false)
  const [roundTransitionText, setRoundTransitionText] = useState("")
  const [soundOn, setSoundOn] = useState(true)
  const { toast } = useToast()
  const audioRef = useRef<HTMLAudioElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [showChat, setShowChat] = useState(false)
  const processedSoldKeyRef = useRef<string | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<any>(null) // Declare currentPlayer variable
  const [playingXI, setPlayingXI] = useState<string[]>([])
  const [captainId, setCaptainId] = useState<string | null>(null)
  const [viceCaptainId, setViceCaptainId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = gameService.subscribeToRoom(gameData.id, (roomData) => {
      if (!roomData) return

      setRoom((prevRoom) => {
        if (prevRoom && prevRoom.soldPlayers && roomData.soldPlayers) {
          const oldSoldIds = Object.keys(prevRoom.soldPlayers)
          const newSoldIds = Object.keys(roomData.soldPlayers)
          const justSoldId = newSoldIds.find((id) => !oldSoldIds.includes(id))

          if (justSoldId) {
            const soldInfo = roomData.soldPlayers[justSoldId]
            const buyer = Object.values(roomData.players).find((p) => p.team === soldInfo.team)
            setSoldPlayerData({
              player: soldInfo.player,
              price: soldInfo.price,
              buyerName: buyer?.name || "Unknown",
            })
            setShowSoldOverlay(true)
            setTimeout(() => {
              setShowSoldOverlay(false)
            }, 3000)
          }
        }

        if (roomData.status === "completed") {
          setShowFinalLeaderboard(true)
        }

        // Use gameService.getCurrentPlayer instead of the local one
        setCurrentPlayer(gameService.getCurrentPlayer(roomData, roomData.auctionPhase || "batsman", roomData.playerIndex || 0))

        const isFast = (roomData as any).auctionMode === "fast"
        if (!isFast && roomData.auctionPhase && !roomData.roundShown?.[roomData.auctionPhase]) {
          const phaseNames = {
            batsman: "BATSMEN ROUND",
            bowler: "BOWLERS ROUND",
            "all-rounder": "ALL-ROUNDERS ROUND",
            "wicket-keeper": "WICKET-KEEPERS ROUND",
            uncapped: "UNCAPPED ROUND",
          }
          setRoundTransitionText(phaseNames[roomData.auctionPhase] || "NEW ROUND")
          setShowRoundTransition(true)
          setTimeout(() => {
            setShowRoundTransition(false)
            gameService.markRoundShown(gameData.id, roomData.auctionPhase!)
          }, 2000)
        }

        return roomData
      })
    })

    return unsubscribe
  }, [gameData.id])

  useEffect(() => {
    if (
      room &&
      room.status === "auction" &&
      room.timeLeft != null &&
      room.timeLeft > 0 &&
      !showSoldOverlay &&
      !showUnsoldOverlay &&
      !showRoundTransition &&
      !showFinalLeaderboard
    ) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(async () => {
        const newTimeLeft = (room.timeLeft ?? 0) - 1

        if (newTimeLeft <= 0) {
          await handleTimeUp()
        } else {
          await gameService.updateTimer(gameData.id, newTimeLeft)
        }
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [room, gameData.id, showSoldOverlay, showUnsoldOverlay, showRoundTransition, showFinalLeaderboard])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = !soundOn
    }
  }, [soundOn])

  const handleTimeUp = async () => {
    if (!room || !currentPlayer) return

    if (room.highestBidder && room.currentBid) {
      await handleAutoSell()
    } else {
      setUnsoldPlayerData(currentPlayer)
      setShowUnsoldOverlay(true)

      setTimeout(() => {
        setShowUnsoldOverlay(false)
        setUnsoldPlayerData(null)
      }, 2000)

      await gameService.markPlayerUnsold(gameData.id)
    }
  }

  const handleAutoSell = async () => {
    if (!room || !currentPlayer || !room.highestBidder || !room.currentBid) return

    const highestBidderTeam = room.players[room.highestBidder]?.team
    if (!highestBidderTeam) return

    setLoading(true)
    try {
      await gameService.sellPlayer(gameData.id, room.highestBidder, room.currentBid, highestBidderTeam)
    } catch (error: any) {
      console.error("Auto-sell error:", error)
      toast({
        title: "Sale Failed",
        description: error.message || "Failed to sell player",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleBid = async () => {
    if (!room || !currentPlayer) return

    const currentBid = room.currentBid || currentPlayer.basePrice
    const increment = room.highestBidder ? getBiddingIncrement(currentBid) : 0
    const newBid = room.highestBidder ? currentBid + increment : currentPlayer.basePrice

    const userPlayer = room.players[user.id]
    if (!userPlayer || userPlayer.budget < newBid) {
      toast({
        title: "Insufficient Budget",
        description: "You don't have enough budget for this bid",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await gameService.placeBid(gameData.id, user.id, newBid)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1000)
    } catch (error: any) {
      toast({
        title: "Bid Failed",
        description: error.message,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleQuitBid = async () => {
    if (!room || !room.highestBidder || !room.currentBid || !currentPlayer) return

    setLoading(true)
    try {
      // Store the current highest bidder info before quitting
      const highestBidderTeam = room.players[room.highestBidder]?.team
      if (highestBidderTeam) {
        await gameService.sellPlayer(gameData.id, room.highestBidder, room.currentBid, highestBidderTeam)
      }
    } catch (error: any) {
      toast({
        title: "Quit Failed",
        description: error.message,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleEndAuction = async () => {
    if (!room || room.hostId !== user.id) return

    setLoading(true)
    try {
      await gameService.endAuction(gameData.id, user.id)
      toast({
        title: "Auction Ended",
        description: "The auction has been ended by the host",
      })
    } catch (error: any) {
      toast({
        title: "End Auction Failed",
        description: error.message,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleSkipPlayer = async () => {
    if (!room || room.hostId !== user.id || !currentPlayer) return

    setLoading(true)
    try {
      await gameService.skipPlayer(gameData.id)
      toast({
        title: "Player Skipped",
        description: `${currentPlayer.name} has been skipped.`,
      })
    } catch (error: any) {
      toast({
        title: "Skip Failed",
        description: error.message,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleClearRoomData = async () => {
    if (!room || room.hostId !== user.id) return;

    setLoading(true);
    try {
      await gameService.clearCompletedRoomData(gameData.id, user.id);
      toast({
        title: "Room Data Cleared",
        description: "All game data for this room has been deleted.",
      });
      onBack(); // Go back to home page after clearing data
    } catch (error: any) {
      toast({
        title: "Clear Data Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const getUserTeam = () => {
    if (!room) return null
    const userPlayer = room.players[user.id]
    return teams.find((t) => t.id === userPlayer?.team)
  }

  const getMyPlayers = () => {
    if (!room) return []
    const userPlayer = room.players[user.id]
    return Object.values(userPlayer?.players || {})
  }

  const formatPrice = (price: number) => {
    if (price >= 100) {
      return `₹${(price / 100).toFixed(1)} Cr`
    }
    return `₹${price} L`
  }

  if (showChat) {
    return <ChatRoom roomId={gameData.id} userId={user.id} userName={user.name} onBack={() => setShowChat(false)} />
  }

  if (!room || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-[300px] h-[300px] rounded-full bg-blue-600/15 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-[340px] h-[340px] rounded-full bg-amber-500/15 blur-3xl" />
        </div>
        <div className="animate-float">
          <Loader2 className="w-16 h-16 animate-spin text-blue-300" />
        </div>
      </div>
    )
  }

  const players = Object.values(room.players)
  const userTeam = getUserTeam()
  const myPlayers = getMyPlayers()
  const currentBid = room.currentBid || currentPlayer.basePrice
  const highestBidder = room.highestBidder ? room.players[room.highestBidder] : null
  const nextBidAmount = room.highestBidder ? currentBid + getBiddingIncrement(currentBid) : currentPlayer.basePrice
  const shouldShowQuitButton =
    room.highestBidder && room.highestBidder !== user.id && room.currentBid && room.currentBid > currentPlayer.basePrice
  const isHost = room.hostId === user.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[300px] h-[300px] rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-[340px] h-[340px] rounded-full bg-amber-500/15 blur-3xl" />
      </div>
      <audio ref={audioRef} preload="auto">
        <source src="/auction-hammer.mp3" type="audio/mpeg" />
      </audio>

      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {showFinalLeaderboard && room.finalLeaderboard && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 max-w-2xl w-full animate-scale-in shadow-2xl">
            <CardHeader className="text-center bg-gradient-to-r from-blue-300 to-amber-300 rounded-t-lg">
              <CardTitle className="text-white flex items-center justify-center space-x-3">
                <Trophy className="w-12 h-12 text-yellow-400 animate-glow" />
                <span className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  FINAL LEADERBOARD
                </span>
                <Trophy className="w-12 h-12 text-yellow-400 animate-glow" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {room.finalLeaderboard.map((team, index) => (
                  <div
                    key={team.teamName}
                    className={`flex items-center justify-between p-6 rounded-2xl transition-all duration-300 hover:scale-105 ${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-400 shadow-lg shadow-yellow-500/20"
                        : index === 1
                          ? "bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-2 border-gray-300 shadow-lg shadow-gray-300/20"
                          : index === 2
                            ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-2 border-amber-400 shadow-lg shadow-amber-500/20"
                            : "bg-white/5 backdrop-blur-sm border border-white/20"
                    }`}
                  >
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-3">
                        {index === 0 && <Crown className="w-10 h-10 text-yellow-400 animate-glow" />}
                        <Badge
                          variant="secondary"
                          className={`text-xl px-6 py-3 font-bold ${
                            index === 0
                              ? "bg-yellow-400 text-black shadow-lg"
                              : index === 1
                                ? "bg-gray-300 text-black shadow-lg"
                                : index === 2
                                  ? "bg-amber-500 text-white shadow-lg"
                                  : "bg-white/20 text-white"
                          }`}
                        >
                          #{index + 1}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-white font-bold text-2xl">{team.teamName}</div>
                        <div className="text-white/70 text-lg">
                          {team.playersCount} players • {formatPrice(team.totalSpent)} spent
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-blue-300">{team.totalPoints}</div>
                      <div className="text-white/70 text-lg">points</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 text-center space-y-4">
                <Button
                  onClick={onBack}
                  className="bg-gradient-to-r from-blue-300 to-amber-300 hover:from-blue-400 hover:to-amber-400 text-white px-12 py-4 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl"
                >
                  Back to Home
                </Button>
                {isHost && (
                  <Button
                    onClick={handleClearRoomData}
                    disabled={loading}
                    className="ml-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-12 py-4 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl"
                  >
                    Clear Room Data
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showSoldOverlay && soldPlayerData && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 max-w-lg w-full animate-scale-in shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-5xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                PLAYER SOLD
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <img
                src={soldPlayerData.player.image || "/placeholder.svg"}
                alt={soldPlayerData.player.name}
                className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-amber-400/40 shadow-xl mb-6"
              />
              <h2 className="text-4xl font-bold text-white mb-3">{soldPlayerData.player.name}</h2>
              <p className="text-2xl text-white/80 mb-4">
                Sold to <span className="font-bold text-amber-300">{soldPlayerData.buyerName}</span>
              </p>
              <div className="text-5xl font-bold text-blue-300 mb-6">{formatPrice(soldPlayerData.price)}</div>
              <div className="text-3xl text-yellow-400 font-bold flex items-center justify-center space-x-3">
                <Sparkles className="w-8 h-8" />
                <span>{soldPlayerData.player.points} POINTS</span>
                <Sparkles className="w-8 h-8" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showUnsoldOverlay && unsoldPlayerData && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center">
          <div className="text-center animate-scale-in">
            <div className="text-9xl font-black text-gray-500 mb-8 transform rotate-12 animate-bounce drop-shadow-2xl">
              UNSOLD
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl">
              <div className="text-6xl font-bold text-white mb-6">{unsoldPlayerData.name}</div>
              <div className="text-2xl text-white/70">No bids received</div>
            </div>
          </div>
        </div>
      )}

      {showRoundTransition && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950/95 via-slate-950/95 to-slate-950/95 backdrop-blur-xl z-50 flex items-center justify-center">
          <div className="text-center animate-scale-in">
            <div className="text-8xl font-black text-white mb-8 animate-glow drop-shadow-2xl">
              {roundTransitionText}
            </div>
            <div className="text-4xl text-white/90 animate-pulse">Get ready for the next phase!</div>
          </div>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-2 md:p-3 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10 px-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-300 to-amber-300 bg-clip-text text-transparent">
              IPL Auction
            </h1>
            {room?.hostId === user.id && (
              <div className="hidden sm:flex items-center gap-2 ml-2">
                <Button
                  size="sm"
                  variant={(room as any)?.auctionMode === "traditional" ? "default" : "outline"}
                  className={
                    (room as any)?.auctionMode === "traditional"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "border-white/20 text-white"
                  }
                  onClick={() => gameService.setAuctionMode(gameData.id, "traditional")}
                >
                  Traditional
                </Button>
                {(room as any)?.auctionMode !== "fast" && (
                  <select
                    aria-label="Change Round"
                    className="ml-2 bg-blue-600 hover:bg-blue-700 text-white border border-white/20 rounded-md px-2 py-1 text-xs"
                    value={room?.auctionPhase || "batsman"}
                    onChange={(e) => gameService.changePhase(gameData.id, e.target.value as any)}
                  >
                    <option value="batsman">Batsman</option>
                    <option value="bowler">Bowler</option>
                    <option value="all-rounder">All-Rounder</option>
                    <option value="wicket-keeper">Wicket-Keeper</option>
                    <option value="uncapped">Uncapped</option>
                  </select>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge className="hidden md:inline bg-white/10 text-slate-100 border border-white/20 px-2 py-1 text-xs">
              {(room as any)?.auctionMode === "fast"
                ? "FAST-PACED"
                : `${(room?.auctionPhase || "").toUpperCase()} ROUND`}
            </Badge>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-md px-2 py-1 border border-white/20">
              <Timer className="w-3 h-3 text-blue-300" />
              <span className="text-base font-bold text-white tabular-nums">{room?.timeLeft ?? 0}s</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChat(true)}
              className="border-white/20 text-white hover:bg-white/10 bg-white/5"
            >
              <MessageCircle className="w-3 h-3 mr-1.5" />
              Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundOn((s) => !s)}
              className="border-white/20 text-white hover:bg-white/10 bg-white/5"
              aria-pressed={soundOn}
              title={soundOn ? "Mute sounds" : "Unmute sounds"}
            >
              {soundOn ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMyTeam(!showMyTeam)}
              className="border-white/20 text-white hover:bg-white/10 bg-white/5"
            >
              <UsersIcon className="w-3 h-3 mr-1.5" />
              My Team ({myPlayers.length})
            </Button>
            {isHost && room.status === "auction" && (
              <Button
                onClick={handleEndAuction}
                disabled={loading}
                size="sm"
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Trophy className="w-3 h-3 mr-1.5" />
                End Auction
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {showMyTeam ? (
          <Card className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <CardHeader className="bg-gradient-to-r from-blue-300 to-amber-300 rounded-t-lg p-4">
              <CardTitle className="text-white flex items-center text-xl font-bold">
                {userTeam && (
                  <img
                    src={userTeam.logo || "/placeholder.svg"}
                    alt={userTeam.name}
                    className="w-10 h-10 object-contain bg-white rounded-full p-1 mr-3 shadow-lg"
                  />
                )}
                My Squad - {userTeam?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {myPlayers.length === 0 ? (
                <div className="text-center text-white/60 py-12">
                  <UsersIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl mb-2">No players purchased yet</p>
                  <p>Start bidding to build your squad!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <h3 className="text-2xl font-bold text-amber-300 mb-4">My Players</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myPlayers.map((playerData) => (
                        <div
                          key={playerData.player.id}
                          className="bg-white/5 p-3 rounded-lg border border-white/10 flex items-center space-x-3"
                        >
                          <img
                            src={playerData.player.image || "/placeholder.svg"}
                            alt={playerData.player.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-blue-400/40"
                          />
                          <div className="flex-1">
                            <h3 className="text-white font-bold text-lg">{playerData.player.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="bg-white/10 text-slate-100 text-xs">
                                {playerData.player.role}
                              </Badge>
                              <span className="text-blue-300 font-bold text-sm">{formatPrice(playerData.price)}</span>
                              <span className="text-yellow-400 font-bold flex items-center space-x-1 text-xs">
                                <Sparkles className="w-3 h-3" />
                                <span>{playerData.player.points}</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <Button
                              size="sm"
                              variant={playingXI.includes(playerData.player.id) ? "default" : "outline"}
                              onClick={() => toggleXI(playerData.player.id, setPlayingXI)}
                              className="text-xs"
                            >
                              XI
                            </Button>
                            <Button
                              size="sm"
                              variant={captainId === playerData.player.id ? "default" : "outline"}
                              onClick={() => setCaptainId(playerData.player.id)}
                              className="text-xs"
                            >
                              C
                            </Button>
                            <Button
                              size="sm"
                              variant={viceCaptainId === playerData.player.id ? "default" : "outline"}
                              onClick={() => setViceCaptainId(playerData.player.id)}
                              className="text-xs"
                            >
                              VC
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-amber-300 mb-4">Playing XI</h3>
                    <div className="bg-green-800/20 p-4 rounded-lg border border-green-500/30">
                      {playingXI.map((playerId) => {
                        const playerData = myPlayers.find((p) => p.player.id === playerId)
                        if (!playerData) return null
                        return (
                          <div
                            key={playerId}
                            className="flex items-center justify-between bg-black/20 p-2 rounded-md mb-2"
                          >
                            <span className="text-white font-semibold">{playerData.player.name}</span>
                            <div>
                              {captainId === playerId && (
                                <Badge className="bg-yellow-500 text-black">C</Badge>
                              )}
                              {viceCaptainId === playerId && (
                                <Badge className="bg-gray-400 text-black ml-1">VC</Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {playingXI.length < 11 && (
                        <div className="text-center text-green-300/70 mt-4">
                          Select {11 - playingXI.length} more players
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-6 text-center">
                <Button
                  onClick={() => setShowMyTeam(false)}
                  className="bg-gradient-to-r from-blue-300 to-amber-300 hover:from-blue-400 hover:to-amber-400 text-white px-8 py-2 text-base font-bold shadow-lg rounded-lg"
                >
                  Back to Auction
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-slide-up">
                <CardHeader className="bg-gradient-to-r from-blue-300 to-amber-300 rounded-t-lg p-4">
                  <CardTitle className="text-white text-center text-xl font-bold">Current Player</CardTitle>
                </CardHeader>
                <CardContent className="text-center p-4">
                  <div className="mb-4">
                    <div className="relative inline-block">
                      <img
                        src={currentPlayer.image || "/placeholder.svg"}
                        alt={currentPlayer.name}
                        className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-blue-400/40 shadow-xl"
                      />
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-300 to-amber-300 text-white rounded-full p-2 shadow-lg">
                        <Sparkles className="w-6 h-6" />
                      </div>
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-white mt-3 mb-2">{currentPlayer.name}</h2>
                    <div className="flex items-center justify-center space-x-4 flex-wrap gap-3">
                      <Badge
                        variant="secondary"
                        className="bg-white/10 text-slate-100 border border-white/20 px-3 py-1.5 text-xs md:text-sm"
                      >
                        {currentPlayer.role}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-white/10 text-slate-100 border border-white/20 px-3 py-1.5 text-xs md:text-sm"
                      >
                        {currentPlayer.nationality}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-white/10 text-slate-100 border border-white/20 px-3 py-1.5 text-xs md:text-sm"
                      >
                        {currentPlayer.category}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-white/10 text-slate-100 border border-white/20 px-3 py-1.5 text-xs md:text-sm font-bold"
                      >
                        ⭐ {currentPlayer.points} pts
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {Object.entries(currentPlayer.stats).map(([key, value]) => (
                      <div key={key} className="text-center bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="text-lg font-bold text-blue-300">{String(value)}</div>
                        <div className="text-white/80 text-xs capitalize mt-1">{key.replace(/([A-Z])/g, " $1")}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 font-medium text-xs">Base Price:</span>
                      <span className="text-white font-bold text-sm">
                        {formatPrice(currentPlayer.basePrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 font-medium text-xs">Current Bid:</span>
                      <span className="text-blue-300 font-bold text-sm">{formatPrice(currentBid)}</span>
                    </div>
                    {highestBidder && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 font-medium text-xs">Highest Bidder:</span>
                        <div className="flex items-center space-x-2">
                          {teams.find((t) => t.id === highestBidder.team) && (
                            <img
                              src={teams.find((t) => t.id === highestBidder.team)?.logo || "/placeholder.svg"}
                              alt="Team"
                              className="w-6 h-6 object-contain bg-white rounded-full p-0.5"
                            />
                          )}
                          <span className="text-blue-300 font-bold text-sm">{highestBidder.name}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <Progress
                      value={((room.timeLeft ?? 0) / (room.highestBidder ? 10 : 15)) * 100}
                      className="h-2.5 bg-white/10"
                    />
                    <div className="text-white/70 text-sm mt-3">
                      {room.highestBidder ? "10 seconds for counter-bids" : "15 seconds initial timer"}
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <Button
                      onClick={handleBid}
                      disabled={loading || !userTeam}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white text-sm py-3 font-bold rounded-lg"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                      Bid {formatPrice(nextBidAmount)}
                    </Button>

                    {shouldShowQuitButton && (
                      <Button
                        onClick={handleQuitBid}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg"
                      >
                        Quit Bid
                      </Button>
                    )}
                  </div>

                  {isHost && (
                    <div className="mt-3">
                      <Button
                        onClick={handleSkipPlayer}
                        disabled={loading}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white text-sm py-3 font-bold rounded-lg"
                      >
                        Skip Player
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-slide-up">
                <CardHeader className="bg-gradient-to-r from-blue-300 to-amber-300 rounded-t-lg p-4">
                  <CardTitle className="text-white text-lg font-bold">Team Budgets</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {players.map((player) => {
                      const team = teams.find((t) => t.id === player.team)
                      const playerCount = Object.keys(player.players || {}).length
                      return (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {team && (
                              <div className="w-8 h-8 rounded-full bg-white grid place-items-center">
                                <img
                                  src={team.logo || "/placeholder.svg"}
                                  alt={team.name}
                                  className="w-6 h-6 object-contain"
                                />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-white font-semibold text-xs truncate">
                                {player.name}
                              </span>
                              <div className="text-white/70 text-xs">{team?.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-blue-300 font-bold text-xs">
                              {formatPrice(player.budget)}
                            </div>
                            <div className="text-white/70 text-xs">{playerCount}/25</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-slide-up">
                <CardHeader className="bg-gradient-to-r from-blue-300 to-amber-300 rounded-t-lg p-4">
                  <CardTitle className="text-white flex items-center text-lg font-bold">
                    <TrendingUp className="w-6 h-6 mr-2 text-blue-300" />
                    Live Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {players
                      .sort((a, b) => {
                        const aPoints = Object.values(a.players || {}).reduce(
                          (sum, p) => sum + (p.player.points || 0),
                          0,
                        )
                        const bPoints = Object.values(b.players || {}).reduce(
                          (sum, p) => sum + (p.player.points || 0),
                          0,
                        )
                        return bPoints - aPoints
                      })
                      .map((player, index) => {
                        const team = teams.find((t) => t.id === player.team)
                        const playerCount = Object.keys(player.players || {}).length
                        const spent = 12000 - player.budget
                        const totalPoints = Object.values(player.players || {}).reduce(
                          (sum, p) => sum + (p.player.points || 0),
                          0,
                        )
                        return (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge
                                variant="secondary"
                                className={`font-bold px-2 py-0.5 text-xs ${
                                  index === 0
                                    ? "bg-yellow-400 text-black"
                                    : index === 1
                                      ? "bg-gray-300 text-black"
                                      : index === 2
                                        ? "bg-amber-500 text-white"
                                        : "bg-blue-500/20 text-blue-200"
                                }`}
                              >
                                #{index + 1}
                              </Badge>
                              {team && (
                                <div className="w-6 h-6 rounded-full bg-white grid place-items-center">
                                  <img
                                    src={team.logo || "/placeholder.svg"}
                                    alt={team.name}
                                    className="w-4 h-4 object-contain"
                                  />
                                </div>
                              )}
                              <span className="text-white font-medium text-xs truncate">
                                {player.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-blue-300 font-bold text-xs">
                                {totalPoints} pts • {playerCount} players
                              </div>
                              <div className="text-white/70 text-xs">{formatPrice(spent)} spent</div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const getBiddingIncrement = (currentBid: number): number => {
  if (currentBid <= 100) return 5 // Up to ₹1 crore: +₹5 lakh
  if (currentBid <= 200) return 10 // ₹1-2 crore: +₹10 lakh
  if (currentBid <= 500) return 20 // ₹2-5 crore: +₹20 lakh
  return 25 // ₹5+ crore: +₹25 lakh
}

const getCurrentPlayer = (room: GameRoom | null): any => {
  if (!room) return null

  const phase = room.auctionPhase || "batsman"
  const index = room.playerIndex || 0
  const soldPlayerIds = new Set(Object.keys(room.soldPlayers || {}))

  let playersInPhase = []

  switch (phase) {
    case "batsman":
      playersInPhase = playersDatabase.filter((p) => p.role === "Batsman" && !soldPlayerIds.has(p.id))
      break
    case "bowler":
      playersInPhase = playersDatabase.filter((p) => p.role === "Bowler" && !soldPlayerIds.has(p.id))
      break
    case "all-rounder":
      playersInPhase = playersDatabase.filter((p) => p.role === "All-Rounder" && !soldPlayerIds.has(p.id))
      break
    case "wicket-keeper":
      playersInPhase = playersDatabase.filter((p) => p.role === "Wicket-Keeper" && !soldPlayerIds.has(p.id))
      break
    case "uncapped":
      playersInPhase = playersDatabase.filter((p) => p.category === "Uncapped" && !soldPlayerIds.has(p.id))
      break
    default:
      playersInPhase = playersDatabase.filter((p) => !soldPlayerIds.has(p.id))
  }

  return playersInPhase[index] || null
}

function toggleXI(id: string, set: React.Dispatch<React.SetStateAction<string[]>>) {
  set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 11)))
}

// Removed the local getCurrentPlayer function as it's now handled by gameService
