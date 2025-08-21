"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Gavel, Timer, TrendingUp, UsersIcon, Loader2, X, Trophy, Crown } from "lucide-react"
import { gameService, teams, type GameRoom } from "@/lib/game-service"
import { playersDatabase } from "@/lib/players-data"
import { useToast } from "@/hooks/use-toast"
import Confetti from "./confetti"

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
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false) // Added final leaderboard state
  const [soldPlayerData, setSoldPlayerData] = useState<{
    player: any
    price: number
    buyerName: string
  } | null>(null)
  const [unsoldPlayerData, setUnsoldPlayerData] = useState<any>(null)
  const [showRoundTransition, setShowRoundTransition] = useState(false)
  const [roundTransitionText, setRoundTransitionText] = useState("")
  const { toast } = useToast()
  const audioRef = useRef<HTMLAudioElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const getBiddingIncrement = (currentBid: number): number => {
    if (currentBid <= 100) return 5 // Up to ₹1 crore: +₹5 lakh
    if (currentBid <= 200) return 10 // ₹1-2 crore: +₹10 lakh
    if (currentBid <= 500) return 20 // ₹2-5 crore: +₹20 lakh
    return 25 // ₹5+ crore: +₹25 lakh
  }

  const getCurrentPlayer = () => {
    if (!room) return null

    const phase = room.auctionPhase || "batsman"
    const index = room.playerIndex || 0

    let playersInPhase = []

    switch (phase) {
      case "batsman":
        playersInPhase = playersDatabase.filter((p) => p.role === "Batsman")
        break
      case "bowler":
        playersInPhase = playersDatabase.filter((p) => p.role === "Bowler")
        break
      case "all-rounder":
        playersInPhase = playersDatabase.filter((p) => p.role === "All-Rounder")
        break
      case "wicket-keeper":
        playersInPhase = playersDatabase.filter((p) => p.role === "Wicket-Keeper")
        break
      case "uncapped":
        playersInPhase = playersDatabase.filter((p) => p.category === "Uncapped")
        break
      default:
        playersInPhase = playersDatabase
    }

    return playersInPhase[index] || null
  }

  const currentPlayer = getCurrentPlayer()

  useEffect(() => {
    const unsubscribe = gameService.subscribeToRoom(gameData.id, (roomData) => {
      if (!roomData) return
      setRoom(roomData)

      if (roomData.status === "completed" && roomData.finalLeaderboard) {
        setShowFinalLeaderboard(true)
        setShowConfetti(true)
        setTimeout(() => {
          gameService.deleteRoom(gameData.id).catch(console.error)
        }, 30000) // Delete room after 30 seconds
      }

      if (roomData.auctionPhase && !roomData.roundShown?.[roomData.auctionPhase]) {
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
        }, 3000)
      }
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
    if (room && room.status === "auction" && room.timeLeft != null && room.timeLeft > 0) {
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
  }, [room, gameData.id])

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

    const soldData = {
      player: currentPlayer,
      price: room.currentBid,
      buyerName: room.players[room.highestBidder]?.name || "Unknown",
    }
    setSoldPlayerData(soldData)

    setLoading(true)
    try {
      await gameService.sellPlayer(gameData.id, room.highestBidder, room.currentBid, highestBidderTeam)

      setShowSoldOverlay(true)
      setShowConfetti(true)

      if (audioRef.current) {
        audioRef.current.play().catch(console.error)
      }

      setTimeout(() => {
        setShowSoldOverlay(false)
        setShowConfetti(false)
        setSoldPlayerData(null)
      }, 3000)
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

    const soldData = {
      player: currentPlayer,
      price: room.currentBid,
      buyerName: room.players[room.highestBidder]?.name || "Unknown",
    }
    setSoldPlayerData(soldData)

    setLoading(true)
    try {
      await gameService.quitBid(gameData.id, user.id)

      setShowSoldOverlay(true)
      setShowConfetti(true)

      if (audioRef.current) {
        audioRef.current.play().catch(console.error)
      }

      setTimeout(() => {
        setShowSoldOverlay(false)
        setShowConfetti(false)
        setSoldPlayerData(null)
      }, 3000)
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

  if (!room || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-800 relative">
      <audio ref={audioRef} preload="auto">
        <source src="/auction-hammer.mp3" type="audio/mpeg" />
      </audio>

      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {showFinalLeaderboard && room.finalLeaderboard && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-2xl w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-white flex items-center justify-center space-x-2">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <span className="text-3xl font-bold">FINAL LEADERBOARD</span>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {room.finalLeaderboard.map((team, index) => (
                  <div
                    key={team.teamName}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      index === 0
                        ? "bg-yellow-500/20 border-2 border-yellow-500"
                        : index === 1
                          ? "bg-gray-300/20 border-2 border-gray-300"
                          : index === 2
                            ? "bg-orange-500/20 border-2 border-orange-500"
                            : "bg-white/5"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {index === 0 && <Crown className="w-6 h-6 text-yellow-500" />}
                        <Badge
                          variant="secondary"
                          className={`
                          ${
                            index === 0
                              ? "bg-yellow-500 text-black"
                              : index === 1
                                ? "bg-gray-300 text-black"
                                : index === 2
                                  ? "bg-orange-500 text-white"
                                  : "bg-white/20 text-white"
                          }
                        `}
                        >
                          #{index + 1}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">{team.teamName}</div>
                        <div className="text-white/60 text-sm">
                          {team.playersCount} players • {formatPrice(team.totalSpent)} spent
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{team.totalPoints}</div>
                      <div className="text-white/60 text-sm">points</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Button onClick={onBack} className="bg-orange-600 hover:bg-orange-700">
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showSoldOverlay && soldPlayerData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center animate-pulse">
            <div className="text-8xl font-black text-red-500 mb-4 transform rotate-12 animate-bounce">SOLD!</div>
            <div className="text-4xl font-bold text-white mb-2">{soldPlayerData.player.name}</div>
            <div className="text-2xl text-orange-400 font-bold">{formatPrice(soldPlayerData.price)}</div>
            <div className="text-lg text-white/80 mt-2">to {soldPlayerData.buyerName}</div>
            <div className="text-lg text-green-400 mt-2">⭐ {soldPlayerData.player.points} points</div>
          </div>
        </div>
      )}

      {showUnsoldOverlay && unsoldPlayerData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center animate-pulse">
            <div className="text-8xl font-black text-gray-500 mb-4 transform rotate-12 animate-bounce">UNSOLD</div>
            <div className="text-4xl font-bold text-white mb-2">{unsoldPlayerData.name}</div>
            <div className="text-lg text-white/80 mt-2">No bids received</div>
          </div>
        </div>
      )}

      {showRoundTransition && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-orange-800 z-50 flex items-center justify-center">
          <div className="text-center animate-pulse">
            <div className="text-6xl font-black text-white mb-4 animate-bounce">{roundTransitionText}</div>
            <div className="text-2xl text-white/80">Get ready for the next phase!</div>
          </div>
        </div>
      )}

      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-white">IPL Auction 2025</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-white/20 text-white">
              {room.auctionPhase?.toUpperCase()} ROUND
            </Badge>
            <div className="flex items-center space-x-2 text-white">
              <Timer className="w-5 h-5" />
              <span className="text-xl font-bold">{room.timeLeft ?? 0}s</span>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowMyTeam(!showMyTeam)}
              className="border-white/30 text-white hover:bg-white/10 bg-transparent"
            >
              <UsersIcon className="w-4 h-4 mr-2" />
              My Team ({myPlayers.length})
            </Button>
            {isHost && room.status === "auction" && (
              <Button onClick={handleEndAuction} disabled={loading} className="bg-red-600 hover:bg-red-700">
                <Trophy className="w-4 h-4 mr-2" />
                End Auction
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {showMyTeam ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                {userTeam && (
                  <img
                    src={userTeam.logo || "/placeholder.svg"}
                    alt={userTeam.name}
                    className="w-8 h-8 object-contain bg-white rounded-full p-1 mr-3"
                  />
                )}
                My Squad - {userTeam?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myPlayers.length === 0 ? (
                <div className="text-center text-white/60 py-8">
                  <p>No players purchased yet</p>
                  <p className="text-sm">Start bidding to build your squad!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myPlayers.map((playerData) => (
                    <div key={playerData.player.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={playerData.player.image || "/placeholder.svg"}
                          alt={playerData.player.name}
                          className="w-12 h-12 mx-auto rounded-full object-cover border-4 border-white/20"
                        />
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{playerData.player.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                              {playerData.player.role}
                            </Badge>
                            <span className="text-orange-400 font-bold text-sm">{formatPrice(playerData.price)}</span>
                            <span className="text-green-400 font-bold text-sm">⭐{playerData.player.points}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 text-center">
                <Button onClick={() => setShowMyTeam(false)} className="bg-orange-600 hover:bg-orange-700">
                  Back to Auction
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-center">Current Player</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <img
                      src={currentPlayer.image || "/placeholder.svg"}
                      alt={currentPlayer.name}
                      className="w-56 h-56 mx-auto rounded-full object-cover border-4 border-white/20"
                    />
                    <h2 className="text-2xl font-bold text-white mt-4">{currentPlayer.name}</h2>
                    <div className="flex items-center justify-center space-x-4 mt-2">
                      <Badge variant="secondary" className="bg-blue-600 text-white">
                        {currentPlayer.role}
                      </Badge>
                      <Badge variant="secondary" className="bg-green-600 text-white">
                        {currentPlayer.nationality}
                      </Badge>
                      <Badge variant="secondary" className="bg-purple-600 text-white">
                        {currentPlayer.category}
                      </Badge>
                      <Badge variant="secondary" className="bg-yellow-600 text-white">
                        ⭐ {currentPlayer.points} pts
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {Object.entries(currentPlayer.stats).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-2xl font-bold text-white">{value}</div>
                        <div className="text-white/60 text-sm capitalize">{key.replace(/([A-Z])/g, " $1")}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Base Price:</span>
                      <span className="text-white font-bold">{formatPrice(currentPlayer.basePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Current Bid:</span>
                      <span className="text-2xl font-bold text-orange-400">{formatPrice(currentBid)}</span>
                    </div>
                    {highestBidder && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Highest Bidder:</span>
                        <div className="flex items-center space-x-2">
                          {teams.find((t) => t.id === highestBidder.team) && (
                            <img
                              src={teams.find((t) => t.id === highestBidder.team)?.logo || "/placeholder.svg"}
                              alt="Team"
                              className="w-6 h-6 object-contain bg-white rounded-full p-1"
                            />
                          )}
                          <span className="text-green-400 font-bold">{highestBidder.name}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <Progress value={((room.timeLeft ?? 0) / (room.highestBidder ? 10 : 15)) * 100} className="h-3" />
                    <div className="text-white/60 text-sm mt-2">
                      {room.highestBidder ? "10 seconds for counter-bids" : "15 seconds initial timer"}
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <Button
                      onClick={handleBid}
                      disabled={loading || !userTeam}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gavel className="w-4 h-4 mr-2" />}
                      Bid {formatPrice(nextBidAmount)}
                    </Button>

                    {shouldShowQuitButton && (
                      <Button
                        onClick={handleQuitBid}
                        disabled={loading}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Quit Bid
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Team Budgets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {players.map((player) => {
                      const team = teams.find((t) => t.id === player.team)
                      const playerCount = Object.keys(player.players || {}).length
                      return (
                        <div key={player.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {team && (
                              <img
                                src={team.logo || "/placeholder.svg"}
                                alt={team.name}
                                className="w-8 h-8 object-contain bg-white rounded-full p-1"
                              />
                            )}
                            <div>
                              <span className="text-white font-medium">{player.name}</span>
                              <div className="text-white/60 text-sm">{team?.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold">{formatPrice(player.budget)}</div>
                            <div className="text-white/60 text-sm">{playerCount}/25 players</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Live Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
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
                        const spent = 12000 - player.budget // Updated for 120 Cr budget
                        const totalPoints = Object.values(player.players || {}).reduce(
                          (sum, p) => sum + (p.player.points || 0),
                          0,
                        )
                        return (
                          <div key={player.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Badge variant="secondary" className="bg-orange-600 text-white">
                                #{index + 1}
                              </Badge>
                              {team && (
                                <img
                                  src={team.logo || "/placeholder.svg"}
                                  alt={team.name}
                                  className="w-6 h-6 object-contain bg-white rounded-full p-1"
                                />
                              )}
                              <span className="text-white text-sm">{player.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-white text-sm">
                                {totalPoints} pts • {playerCount} players
                              </div>
                              <div className="text-white/60 text-xs">{formatPrice(spent)} spent</div>
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

const formatPrice = (price: number) => {
  if (price >= 100) {
    return `₹${(price / 100).toFixed(1)} Cr`
  }
  return `₹${price} L`
}
