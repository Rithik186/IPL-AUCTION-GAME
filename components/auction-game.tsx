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
  Pause,
  Play,
  Download,
  Copy,
  Share2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
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

const getTeamColorStyles = (teamId: string) => {
  const styles: Record<string, {
    text: string,
    bg: string,
    border: string,
    gradient: string,
    shadow: string,
    priceBg: string
  }> = {
    csk: {
      text: "text-yellow-400",
      bg: "bg-yellow-500",
      border: "border-yellow-400/80",
      gradient: "from-yellow-300 via-yellow-400 to-yellow-600",
      shadow: "shadow-[0_0_50px_rgba(234,179,8,0.3)]",
      priceBg: "from-yellow-900/40 via-yellow-800/40 to-yellow-900/40"
    },
    rcb: {
      text: "text-red-500",
      bg: "bg-red-600",
      border: "border-red-500/80",
      gradient: "from-red-400 via-red-500 to-red-700",
      shadow: "shadow-[0_0_50px_rgba(239,68,68,0.3)]",
      priceBg: "from-red-900/40 via-red-800/40 to-red-900/40"
    },
    mi: {
      text: "text-blue-400",
      bg: "bg-blue-600",
      border: "border-blue-400/80",
      gradient: "from-blue-300 via-blue-400 to-blue-600",
      shadow: "shadow-[0_0_50px_rgba(59,130,246,0.3)]",
      priceBg: "from-blue-900/40 via-blue-800/40 to-blue-900/40"
    },
    kkr: {
      text: "text-purple-400",
      bg: "bg-purple-600",
      border: "border-purple-400/80",
      gradient: "from-purple-300 via-purple-400 to-purple-600",
      shadow: "shadow-[0_0_50px_rgba(168,85,247,0.3)]",
      priceBg: "from-purple-900/40 via-purple-800/40 to-purple-900/40"
    },
    dc: {
      text: "text-blue-400",
      bg: "bg-blue-500",
      border: "border-blue-400/80",
      gradient: "from-blue-300 via-blue-400 to-blue-600",
      shadow: "shadow-[0_0_50px_rgba(59,130,246,0.3)]",
      priceBg: "from-blue-900/40 via-blue-800/40 to-blue-900/40"
    },
    rr: {
      text: "text-pink-400",
      bg: "bg-pink-600",
      border: "border-pink-400/80",
      gradient: "from-pink-300 via-pink-400 to-pink-600",
      shadow: "shadow-[0_0_50px_rgba(236,72,153,0.3)]",
      priceBg: "from-pink-900/40 via-pink-800/40 to-pink-900/40"
    },
    srh: {
      text: "text-orange-400",
      bg: "bg-orange-600",
      border: "border-orange-400/80",
      gradient: "from-orange-300 via-orange-400 to-orange-600",
      shadow: "shadow-[0_0_50px_rgba(249,115,22,0.3)]",
      priceBg: "from-orange-900/40 via-orange-800/40 to-orange-900/40"
    },
    pbks: {
      text: "text-red-400",
      bg: "bg-red-500",
      border: "border-red-400/80",
      gradient: "from-red-300 via-red-400 to-red-600",
      shadow: "shadow-[0_0_50px_rgba(239,68,68,0.3)]",
      priceBg: "from-red-900/40 via-red-800/40 to-red-900/40"
    },
    gt: {
      text: "text-indigo-400",
      bg: "bg-indigo-600",
      border: "border-indigo-400/80",
      gradient: "from-indigo-300 via-indigo-400 to-indigo-600",
      shadow: "shadow-[0_0_50px_rgba(99,102,241,0.3)]",
      priceBg: "from-indigo-900/40 via-indigo-800/40 to-indigo-900/40"
    },
    lsg: {
      text: "text-cyan-400",
      bg: "bg-cyan-500",
      border: "border-cyan-400/80",
      gradient: "from-cyan-300 via-cyan-400 to-cyan-600",
      shadow: "shadow-[0_0_50px_rgba(6,182,212,0.3)]",
      priceBg: "from-cyan-900/40 via-cyan-800/40 to-cyan-900/40"
    }
  }
  return styles[teamId] || {
    text: "text-emerald-400",
    bg: "bg-emerald-500",
    border: "border-emerald-400/80",
    gradient: "from-emerald-300 via-green-400 to-emerald-600",
    shadow: "shadow-[0_0_50px_rgba(16,185,129,0.3)]",
    priceBg: "from-emerald-900/40 via-emerald-800/40 to-emerald-900/40"
  }
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
    teamId: string
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
  const [swapMode, setSwapMode] = useState<string | null>(null) // ID of player in XI to swap out

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
              teamId: soldInfo.team,
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
          const phaseNames: Record<string, string> = {
            batsman: "BATSMEN ROUND",
            bowler: "BOWLERS ROUND",
            "all-rounder": "ALL-ROUNDERS ROUND",
            "wicket-keeper": "WICKET-KEEPERS ROUND",
          }
          const phaseKey = roomData.auctionPhase as string
          setRoundTransitionText(phaseNames[phaseKey] || "NEW ROUND")
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

  // Sync My Team Data (Playing XI, Captain, VC) from Room
  useEffect(() => {
    if (room && room.players && room.players[user.id]) {
      const myData = room.players[user.id]
      if (myData.playingXI) setPlayingXI(myData.playingXI)
      if (myData.captainId !== undefined) setCaptainId(myData.captainId)
      if (myData.viceCaptainId !== undefined) setViceCaptainId(myData.viceCaptainId)
    }
  }, [room, user.id])


  useEffect(() => {
    if (
      room &&
      room.status === "auction" &&
      room.timeLeft != null &&
      room.timeLeft > 0 &&
      !showSoldOverlay &&
      !showUnsoldOverlay &&
      !showRoundTransition &&
      !showFinalLeaderboard &&
      !room.isPaused
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

    // Prevent consecutive bids by the same team
    if (room.highestBidder === user.id) {
      toast({
        title: "Consecutive Bid",
        description: "You are already the highest bidder! Wait for someone else to bid.",
        variant: "destructive",
      })
      return
    }

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

  const handlePauseGame = async () => {
    try {
      await gameService.togglePause(gameData.id, true)
      toast({ title: "Game Paused", description: "The auction has been paused." })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const handleResumeGame = async () => {
    try {
      await gameService.togglePause(gameData.id, false)
      toast({ title: "Game Resumed", description: "The auction is live again!" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const handleDownloadPDF = () => {
    if (!room) return
    const userTeam = getUserTeam()
    const myPlayers = getMyPlayers()
    if (!userTeam) return

    const doc = new jsPDF()

    // Background
    doc.setFillColor(5, 5, 17) // Dark background #050511
    doc.rect(0, 0, 210, 297, "F")

    // Header
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(24)
    doc.text("IPL AUCTION 2025", 105, 20, { align: "center" })

    // Team Name
    doc.setFontSize(32)
    doc.setTextColor(59, 130, 246) // Blue 500
    doc.text(userTeam.name.toUpperCase(), 105, 35, { align: "center" })

    // Stats
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    const totalSpent = myPlayers.reduce((sum, p) => sum + p.price, 0)
    const totalPoints = myPlayers.reduce((sum, p) => sum + p.player.points, 0)
    doc.text(`Total Spent: ${formatPrice(totalSpent)}  •  Total Points: ${totalPoints}`, 105, 45, { align: "center" })

    // Playing XI Section
    doc.setFontSize(16)
    doc.setTextColor(250, 204, 21) // Yellow 400
    doc.text("PLAYING XI", 14, 60)

    const xiPlayers = playingXI.map(id => {
      const p = myPlayers.find(mp => mp.player.id === id)
      return p ? p : null
    }).filter(p => p !== null)

    const benchPlayers = myPlayers.filter(p => !playingXI.includes(p.player.id))

    const xiData = xiPlayers.map((p, index) => [
      index + 1,
      p?.player.name + (captainId === p?.player.id ? " (C)" : "") + (viceCaptainId === p?.player.id ? " (VC)" : ""),
      p?.player.role,
      formatPrice(p?.price || 0)
    ])

    autoTable(doc, {
      startY: 65,
      head: [['#', 'Player Name', 'Role', 'Price']],
      body: xiData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' }, // Emerald 500
      styles: { fillColor: [30, 41, 59], textColor: 255, lineColor: [255, 255, 255] }, // Slate 800
      alternateRowStyles: { fillColor: [15, 23, 42] }, // Slate 900
    })

    // Bench Section
    const finalY = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(16)
    doc.setTextColor(250, 204, 21) // Yellow 400
    doc.text(`SQUAD / BENCH (${benchPlayers.length})`, 14, finalY)

    const benchData = benchPlayers.map((p, index) => [
      index + 1,
      p.player.name,
      p.player.role,
      formatPrice(p.price)
    ])

    autoTable(doc, {
      startY: finalY + 5,
      head: [['#', 'Player Name', 'Role', 'Price']],
      body: benchData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' }, // Blue 500
      styles: { fillColor: [30, 41, 59], textColor: 255, lineColor: [255, 255, 255] }, // Slate 800
      alternateRowStyles: { fillColor: [15, 23, 42] }, // Slate 900
    })

    // Footer
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text("Generated by IPL Auction Game", 105, 290, { align: "center" })

    doc.save(`${userTeam.name}_Squad.pdf`)
  }

  // if (showChat) { ... } logic removed to allow side-by-side

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

  const isHost = room.hostId === user.id

  // --- Playing XI Handlers ---

  const handleToggleXI = (playerId: string) => {
    // If player is invalid or not in my players, ignore
    if (!myPlayers.some(p => p.player.id === playerId)) return

    const isInXI = playingXI.includes(playerId)
    let newXI = [...playingXI]

    if (isInXI) {
      newXI = newXI.filter(id => id !== playerId)
    } else {
      if (newXI.length >= 11) {
        toast({ title: "Playing XI Full", description: "You can only select 11 players. Use Swap to replace.", variant: "destructive" })
        return
      }
      newXI.push(playerId)
    }

    // Check if C/VC is removed
    const newCaptainId = isInXI && captainId === playerId ? null : captainId
    const newViceCaptainId = isInXI && viceCaptainId === playerId ? null : viceCaptainId

    // Optimistic Update
    setPlayingXI(newXI)
    if (newCaptainId !== captainId) setCaptainId(newCaptainId)
    if (newViceCaptainId !== viceCaptainId) setViceCaptainId(newViceCaptainId)

    gameService.updatePlayingXI(gameData.id, user.id, newXI, newCaptainId, newViceCaptainId)
  }

  const handleSetCaptain = (playerId: string) => {
    // Must be in XI
    if (!playingXI.includes(playerId)) {
      toast({ title: "Invalid Selection", description: "Player must be in Playing XI to be Captain", variant: "destructive" })
      return
    }
    const newId = captainId === playerId ? null : playerId

    // Optimistic
    setCaptainId(newId)

    gameService.updatePlayingXI(gameData.id, user.id, playingXI, newId, viceCaptainId)
  }

  const handleSetViceCaptain = (playerId: string) => {
    if (!playingXI.includes(playerId)) {
      toast({ title: "Invalid Selection", description: "Player must be in Playing XI to be Vice Captain", variant: "destructive" })
      return
    }
    const newId = viceCaptainId === playerId ? null : playerId

    // Optimistic
    setViceCaptainId(newId)

    gameService.updatePlayingXI(gameData.id, user.id, playingXI, captainId, newId)
  }

  const handleSwapPlayerInXI = (playerInXI: string, playerInBench: string) => {
    if (!playingXI.includes(playerInXI)) return

    const newXI = playingXI.map(id => id === playerInXI ? playerInBench : id)

    // Handle C/VC transfer if needed (or just reset)
    let newCaptainId = captainId
    let newViceCaptainId = viceCaptainId

    if (captainId === playerInXI) newCaptainId = null
    if (viceCaptainId === playerInXI) newViceCaptainId = null

    setPlayingXI(newXI)
    setCaptainId(newCaptainId)
    setViceCaptainId(newViceCaptainId)

    gameService.updatePlayingXI(gameData.id, user.id, newXI, newCaptainId, newViceCaptainId)
    toast({ title: "Player Swapped", description: "Successfully swapped players." })
  }

  /* New Smart Interaction Handler */
  const handlePlayerClick = (targetPlayerId: string, location: 'BENCH' | 'XI') => {
    // If we have a selected player (from XI)
    if (swapMode) {
      const selectedId = swapMode

      // Case 1: Clicking the SAME player -> Deselect
      if (selectedId === targetPlayerId) {
        setSwapMode(null)
        return
      }

      const targetInXI = playingXI.includes(targetPlayerId)

      // Case 2: Swapping two XI players (Reorder)
      if (targetInXI) {
        const fromIndex = playingXI.indexOf(selectedId)
        const toIndex = playingXI.indexOf(targetPlayerId)

        if (fromIndex === -1 || toIndex === -1) return

        const newXI = [...playingXI]
        newXI[fromIndex] = targetPlayerId
        newXI[toIndex] = selectedId

        setPlayingXI(newXI)
        gameService.updatePlayingXI(gameData.id, user.id, newXI, captainId, viceCaptainId)
        setSwapMode(null)
        toast({ title: "Reordered", description: "Players swapped positions." })
        return
      }

      // Case 3: Swapping XI player with Bench player
      if (!targetInXI) {
        handleSwapPlayerInXI(selectedId, targetPlayerId)
        setSwapMode(null)
        return
      }

    } else {
      // No selection active

      // Case 4: Clicked XI player -> Select for potential swap/reorder
      if (location === 'XI') {
        setSwapMode(targetPlayerId)
        return
      }

      // Case 5: Clicked Bench player -> Add to XI (if space)
      if (location === 'BENCH') {
        handleToggleXI(targetPlayerId)
      }
    }
  }



  return (
    <div className="min-h-screen bg-[#050511] font-sans text-slate-100 selection:bg-cyan-500/30 flex overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[100px] animate-blob-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/10 blur-[100px] animate-blob-2" />
        <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-cyan-600/5 blur-[80px] animate-blob-3" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className={`flex-1 flex flex-col relative transition-all duration-300 h-screen overflow-y-auto ${showChat ? "mr-[300px]" : ""} scrollbar-hide`}>
        <audio ref={audioRef} preload="auto">
          <source src="/auction-hammer.mp3" type="audio/mpeg" />
        </audio>

        <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

        {showFinalLeaderboard && room.finalLeaderboard && (
          <div className="fixed inset-0 bg-[#000000]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <Card className="bg-[#121425] border border-white/10 max-w-4xl w-full animate-scale-in shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-yellow-500/10 blur-[80px] pointer-events-none" />

              <CardHeader className="text-center pb-2 relative z-10">
                <CardTitle className="text-white flex flex-col items-center justify-center space-y-4">
                  <Trophy className="w-20 h-20 text-yellow-400 animate-bounce drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
                  <span className="text-5xl md:text-7xl font-black bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 bg-clip-text text-transparent uppercase tracking-tighter">
                    Champions
                  </span>
                  <span className="text-white/40 text-sm font-bold tracking-[0.5em] uppercase">Final Standings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 relative z-10">
                <div className="space-y-4">
                  {room.finalLeaderboard.map((team, index) => (
                    <div
                      key={team.teamName}
                      className={`flex items-center justify-between p-4 md:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] border ${index === 0
                        ? "bg-gradient-to-r from-yellow-500/20 to-black border-yellow-500/50 shadow-[0_0_30px_-5px_rgba(234,179,8,0.2)]"
                        : index === 1
                          ? "bg-gradient-to-r from-slate-300/20 to-black border-slate-300/50"
                          : index === 2
                            ? "bg-gradient-to-r from-amber-700/20 to-black border-amber-700/50"
                            : "bg-white/5 border-white/5"
                        }`}
                    >
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 relative">
                          {index === 0 && <Crown className="absolute -top-6 w-8 h-8 text-yellow-400 animate-pulse" />}
                          <span className={`text-2xl md:text-4xl font-black ${index === 0 ? "text-yellow-400" : index === 1 ? "text-slate-300" : index === 2 ? "text-amber-700" : "text-white/20"
                            }`}>#{index + 1}</span>
                        </div>
                        <div>
                          <div className="text-white font-black text-2xl md:text-4xl uppercase tracking-tight">{team.teamName}</div>
                          <div className="text-white/50 text-base font-medium mt-1">
                            {team.playersCount} players • <span className="text-white/80">{formatPrice(team.totalSpent)}</span> spent
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">{team.totalPoints}</div>
                        <div className="text-white/40 text-xs font-bold uppercase tracking-widest">Total Points</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-10 text-center space-x-4">
                  <Button
                    onClick={onBack}
                    className="bg-white text-black hover:bg-slate-200 px-10 py-6 text-xl font-bold rounded-xl"
                  >
                    Back to Hub
                  </Button>
                  {isHost && (
                    <Button
                      onClick={handleClearRoomData}
                      disabled={loading}
                      variant="destructive"
                      className="px-10 py-6 text-xl font-bold rounded-xl"
                    >
                      Reset Room
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}






        {showRoundTransition && (
          <div className="fixed inset-0 bg-[#050511] z-50 flex items-center justify-center overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/20 to-purple-900/20" />
            <div className="absolute w-[500px] h-[500px] bg-cyan-500/20 blur-[150px] rounded-full animate-pulse top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

            <div className="text-center animate-scale-in relative z-10 p-8">
              <div className="inline-block relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-lg blur opacity-40 animate-tilt" />
                <div className="relative text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-4 drop-shadow-2xl">
                  {roundTransitionText}
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-cyan-400 mt-8 animate-bounce flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6" /> NEXT PHASE STARTING <Sparkles className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Paused Overlay */}
        {room?.isPaused && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="bg-[#121425] border border-amber-500/30 p-8 md:p-12 rounded-3xl text-center shadow-2xl animate-scale-in max-w-lg w-full relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-pulse" />

              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Pause className="w-10 h-10 text-amber-500 animate-pulse" />
              </div>

              <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-2">Auction Paused</h2>
              <p className="text-white/50 text-lg mb-8">The host has temporarily suspended the bidding.</p>

              {isHost && (
                <Button
                  onClick={handleResumeGame}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                >
                  <Play className="w-5 h-5 mr-3 fill-current" />
                  RESUME LIVE AUCTION
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="sticky top-0 z-40 bg-[#0B0C15]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10 px-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-lg md:text-xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                IPL Auction <span className="text-cyan-400 text-base not-italic tracking-normal">Live</span>
              </h1>
              {room?.hostId === user.id && (
                <div className="hidden sm:flex items-center gap-2 ml-2">
                  {/* Timer Selector */}
                  <div className="flex items-center bg-white/10 rounded-md p-0.5 border border-white/10 ml-2">
                    <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider mx-2">Timer</span>
                    <select
                      className="bg-black/40 text-white text-xs font-bold rounded px-1 py-1 border border-white/10 outline-none focus:border-cyan-500/50 cursor-pointer hover:bg-black/60"
                      value={room?.bidDuration || 15}
                      onChange={(e) => gameService.setBidDuration(gameData.id, Number(e.target.value))}
                    >
                      {[5, 10, 15, 20, 30].map(sec => (
                        <option key={sec} value={sec}>{sec}s</option>
                      ))}
                    </select>
                  </div>

                  <select
                    aria-label="Change Round"
                    className="ml-2 bg-blue-600 hover:bg-blue-700 text-white border border-white/20 rounded-md px-2 py-1 text-xs cursor-pointer"
                    value={room?.auctionPhase || "batsman"}
                    onChange={(e) => gameService.changePhase(gameData.id, e.target.value as any)}
                  >
                    <option value="batsman">Batsman</option>
                    <option value="bowler">Bowler</option>
                    <option value="all-rounder">All-Rounder</option>
                    <option value="wicket-keeper">Wicket-Keeper</option>
                  </select>
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
                <>
                  <Button
                    onClick={room.isPaused ? handleResumeGame : handlePauseGame}
                    size="sm"
                    className={`${room.isPaused ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
                      } text-white shadow-md hover:shadow-lg transition-all`}
                    title={room.isPaused ? "Resume Game" : "Pause Game"}
                  >
                    {room.isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    <span className="sr-only">{room.isPaused ? "Resume" : "Pause"}</span>
                  </Button>
                  <Button
                    onClick={handleEndAuction}
                    disabled={loading}
                    size="sm"
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Trophy className="w-3 h-3 mr-1.5" />
                    End Auction
                  </Button>
                </>
              )}

              {/* Room ID & Copy */}
              <div className="flex items-center gap-1.5 bg-white/10 rounded-md px-2 py-1 border border-white/20 ml-2">
                <span className="text-xs text-white/60 font-bold uppercase tracking-wider hidden sm:inline">Room:</span>
                <code className="text-sm font-mono font-bold text-white">{gameData.id}</code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 text-white/60 hover:text-white"
                  onClick={() => {
                    navigator.clipboard.writeText(gameData.id);
                    toast({ title: "Copied!", description: "Room ID copied to clipboard." });
                  }}
                  title="Copy Room ID"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>

              {/* WhatsApp Share */}
              <Button
                size="sm"
                className="bg-[#25D366] hover:bg-[#20bd5a] text-white border border-white/10 shadow-md px-3"
                onClick={() => {
                  const text = `Join my IPL Auction Game! Room ID: *${gameData.id}*`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                }}
                title="Share on WhatsApp"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </Button>

              {/* Generic Share */}
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white border border-white/10 shadow-md px-3"
                onClick={() => {
                  const text = `Join my IPL Auction Game! Room ID: ${gameData.id}`;
                  if (navigator.share) {
                    navigator.share({
                      title: "IPL Auction Game",
                      text: text,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(text);
                    toast({ title: "Copied!", description: "Share info copied to clipboard." });
                  }
                }}
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {showMyTeam ? (
            <Card className="bg-[#121425]/90 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <CardHeader className="bg-white/5 p-6 border-b border-white/5">
                <CardTitle className="text-white flex items-center text-2xl font-bold">
                  {userTeam && (
                    <div className="w-12 h-12 bg-white rounded-xl p-2 mr-4 flex items-center justify-center shadow-lg">
                      <img
                        src={userTeam.logo || "/placeholder.svg"}
                        alt={userTeam.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <span className="block text-sm text-white/40 uppercase tracking-widest">Managing</span>
                    {userTeam?.name || "Your Team"}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                {myPlayers.length === 0 ? (
                  <div className="text-center text-white/30 py-20 border-2 border-dashed border-white/10 rounded-xl">
                    <UsersIcon className="w-20 h-20 mx-auto mb-6 opacity-50" />
                    <p className="text-2xl font-bold text-white/50">Your squad is empty</p>
                    <p className="mt-2">Join the bidding to build your dream team!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-8">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-cyan-400" />
                        Squad List <span className="text-white/40 text-sm ml-2">({myPlayers.length} Players)</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myPlayers.map((playerData) => (
                          <div
                            key={playerData.player.id}
                            className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 flex items-start space-x-4 transition-all group"
                          >
                            <div className="relative">
                              <img
                                src={playerData.player.image || "/placeholder.svg"}
                                alt={playerData.player.name}
                                className="w-16 h-16 rounded-lg object-cover bg-[#0B0C15]"
                              />
                              <div className="absolute -bottom-2 -right-2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded border border-white/10">
                                {playerData.player.role.slice(0, 3)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold text-lg truncate group-hover:text-cyan-400 transition-colors">{playerData.player.name}</h3>
                              <div className="flex items-center space-x-3 mt-2">
                                <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-400/10 px-2 py-0.5 rounded">{formatPrice(playerData.price)}</span>
                                <span className="text-yellow-400 font-bold text-xs flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> {playerData.player.points}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              {/* Smart Action Button */}
                              <Button
                                size="sm"
                                variant={playingXI.includes(playerData.player.id)
                                  ? "default"
                                  : (swapMode) ? "destructive" : "secondary"} // Orange/Destructive color when swapping
                                onClick={() => handlePlayerClick(playerData.player.id, 'BENCH')}
                                className={`h-7 px-2 text-[10px] uppercase font-bold tracking-wider ${playingXI.includes(playerData.player.id) ? "bg-cyan-600 hover:bg-cyan-700 text-white" :
                                  swapMode ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse" :
                                    "bg-white/10 text-white/60 hover:text-white"
                                  }`}
                              >
                                {playingXI.includes(playerData.player.id) ? "In XI" : swapMode ? "Swap" : "Add"}
                              </Button>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant={captainId === playerData.player.id ? "default" : "ghost"}
                                  onClick={() => handleSetCaptain(playerData.player.id)}
                                  className={`flex-1 h-6 px-0 text-[10px] font-bold ${captainId === playerData.player.id ? "bg-yellow-500 text-black hover:bg-yellow-600" : "bg-white/5 text-white/40"}`}
                                  title="Captain"
                                >
                                  C
                                </Button>
                                <Button
                                  size="sm"
                                  variant={viceCaptainId === playerData.player.id ? "default" : "ghost"}
                                  onClick={() => handleSetViceCaptain(playerData.player.id)}
                                  className={`flex-1 h-6 px-0 text-[10px] font-bold ${viceCaptainId === playerData.player.id ? "bg-slate-400 text-black hover:bg-slate-500" : "bg-white/5 text-white/40"}`}
                                  title="Vice Captain"
                                >
                                  VC
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="xl:col-span-4">
                      <div className="bg-gradient-to-b from-green-900/40 to-green-900/20 p-6 rounded-2xl border border-green-500/20 sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-green-400">Playing XI</h3>
                          <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                            {playingXI.length}/11
                          </span>
                        </div>

                        <div className="space-y-2">
                          {playingXI.length === 0 && (
                            <div className="text-center py-8 text-white/30 text-sm">
                              Select players from your squad to form your Playing XI
                            </div>
                          )}
                          {playingXI.map((playerId, idx) => {
                            const playerData = myPlayers.find((p) => p.player.id === playerId)
                            if (!playerData) return null
                            return (
                              <div
                                key={playerId}
                                onClick={() => handlePlayerClick(playerId, 'XI')}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer group hover:bg-white/10 ${swapMode === playerId
                                  ? "bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                  : "bg-black/40 border-white/5"
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`font-mono text-xs w-4 ${swapMode === playerId ? "text-amber-400 font-bold" : "text-white/20"}`}>
                                    {idx + 1}
                                  </span>
                                  <span className={`font-medium text-sm ${swapMode === playerId ? "text-amber-100" : "text-white"}`}>
                                    {playerData.player.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">

                                  {/* Selection Indicator (Swap Mode) */}
                                  {swapMode === playerId && (
                                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mr-2 animate-pulse">
                                      Selected
                                    </span>
                                  )}

                                  {captainId === playerId && (
                                    <Badge className="bg-yellow-500 text-black text-[10px] h-5 px-1.5 cursor-pointer hover:bg-yellow-600 shadow-lg hover:scale-105 transition-transform" onClick={(e) => { e.stopPropagation(); handleSetCaptain(playerId); }}>C</Badge>
                                  )}
                                  {viceCaptainId === playerId && (
                                    <Badge className="bg-slate-400 text-black text-[10px] h-5 px-1.5 cursor-pointer hover:bg-slate-500 shadow-lg hover:scale-105 transition-transform" onClick={(e) => { e.stopPropagation(); handleSetViceCaptain(playerId); }}>VC</Badge>
                                  )}

                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-white/20 hover:text-red-400 ml-1"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent selection when removing
                                      handleToggleXI(playerId);
                                    }}
                                  >
                                    <span className="sr-only">Remove</span>
                                    ×
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {playingXI.length < 11 && (
                          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center gap-2 text-green-400 text-sm animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Select {11 - playingXI.length} more players
                          </div>
                        )}

                        {playingXI.length === 11 && (
                          <div className="mt-6">
                            <Button
                              onClick={handleDownloadPDF}
                              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-6 text-lg rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                            >
                              <Download className="w-6 h-6 mr-3 group-hover:animate-bounce" />
                              DOWNLOAD TEAM SHEET
                            </Button>
                            <p className="text-center text-green-400 text-xs mt-3 flex items-center justify-center gap-1.5 opacity-80">
                              <Sparkles className="w-3 h-3" /> Playing XI Complete!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                  <Button
                    onClick={() => setShowMyTeam(false)}
                    className="bg-white text-black hover:bg-slate-200 px-8 py-2 font-bold rounded-lg"
                  >
                    Return to Auction Floor
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 max-w-7xl mx-auto">
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                <Card className="flex-1 bg-[#121425]/60 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] animate-slide-up relative overflow-hidden group">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/20 transition-all duration-700" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:bg-fuchsia-500/20 transition-all duration-700" />

                  {showUnsoldOverlay && unsoldPlayerData && (
                    <div className="absolute inset-0 z-50 bg-[#0B0C15]/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                      {/* Cracked Glass / Distress Effect Background */}
                      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />

                      <div className="relative z-10 text-center animate-in zoom-in-50 duration-300 ease-out">
                        {/* Dynamic Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-red-600/20 blur-[100px] rounded-full animate-pulse" />

                        {/* Massive Stamp */}
                        <div className="relative transform -rotate-12 border-8 border-red-600/80 px-12 py-4 rounded-xl bg-black/60 shadow-2xl backdrop-blur-md">
                          <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-red-600 to-red-800 uppercase tracking-tighter drop-shadow-[0_0_50px_rgba(220,38,38,0.8)] animate-pulse">
                            UNSOLD
                          </h1>
                        </div>

                        <div className="mt-8 space-y-2 relative z-20">
                          <h2 className="text-3xl font-bold text-white drop-shadow-md">{unsoldPlayerData.name}</h2>
                          <p className="text-white/50 text-lg uppercase tracking-widest font-bold">Passed at {formatPrice(unsoldPlayerData.basePrice)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {showSoldOverlay && soldPlayerData && (() => {
                    const teamId = soldPlayerData.teamId ||
                      Object.values(room?.players || {}).find(p => p.name === soldPlayerData.buyerName)?.team;
                    const soldTeam = teams.find(t => t.id === teamId);
                    const theme = getTeamColorStyles(teamId || 'csk');

                    return (
                      <div className="absolute inset-0 z-50 bg-[#0B0C15]/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                        <div className={`absolute inset-0 bg-gradient-to-b ${theme.priceBg} opacity-20 mix-blend-overlay`} />
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />

                        {soldTeam?.logo && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                            <img
                              src={soldTeam.logo}
                              alt="Team Watermark"
                              className="w-[100%] h-[100%] object-contain opacity-[0.05] blur-sm scale-125 animate-pulse mix-blend-screen"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C15] via-transparent to-[#0B0C15] opacity-80" />
                          </div>
                        )}

                        <div className="relative z-10 text-center w-full max-w-xl animate-in zoom-in-50 duration-500 ease-out px-4">
                          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] ${theme.bg} opacity-10 blur-[120px] rounded-full animate-pulse`} />

                          <div className={`relative transform -rotate-6 border-[6px] ${theme.border} px-8 py-2 md:px-12 md:py-4 rounded-xl bg-black/80 ${theme.shadow} backdrop-blur-xl mb-8 mx-auto inline-block hover:scale-105 transition-transform duration-300`}>
                            <h1 className={`text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br ${theme.gradient} uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-shimmer`}>
                              SOLD!
                            </h1>
                          </div>

                          <div className="space-y-6 relative z-20">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <div className={`w-28 h-28 md:w-32 md:h-32 bg-white rounded-2xl p-3 ${theme.shadow} animate-bounce relative z-10`}>
                                {soldTeam ? (
                                  <img
                                    src={soldTeam.logo}
                                    alt="Team Logo"
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-black text-2xl text-black">
                                    {soldPlayerData.buyerName.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1">
                                <h2 className="text-3xl md:text-4xl font-black text-white drop-shadow-xl tracking-tight leading-none">{soldPlayerData.player.name}</h2>
                                <div className={`text-lg md:text-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${theme.text}`}>
                                  Joined {soldTeam?.name || soldPlayerData.buyerName}
                                </div>
                              </div>
                            </div>

                            <div className={`bg-gradient-to-r ${theme.priceBg} border-y ${theme.border.replace('border-', 'border-opacity-30 border-')} p-4 relative z-10 transform skew-x-[-10deg]`}>
                              <div className="transform skew-x-[10deg]">
                                <p className={`${theme.text} opacity-80 text-xs font-black uppercase tracking-[0.4em] mb-1`}>Selling Price</p>
                                <p className="text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                  {formatPrice(soldPlayerData.price)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  <CardHeader className="relative z-10 p-6 pb-0 flex flex-row items-center justify-between border-b border-white/5">
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                      <span className="text-xs font-bold tracking-[0.2em] text-red-500 uppercase">Live Auction</span>
                    </div>
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-white/50 text-[10px] tracking-widest uppercase">
                      Lot #{currentPlayer.id.slice(0, 4)}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 relative z-10 flex flex-col h-full justify-between">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                      <div className="relative group/image shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-fuchsia-600 rounded-2xl blur opacity-30 group-hover/image:opacity-60 transition-opacity duration-500" />
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-2xl">
                          <img
                            src={currentPlayer.image || "/placeholder.svg"}
                            alt={currentPlayer.name}
                            className="w-full h-full object-cover transform group-hover/image:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C15] via-transparent to-transparent opacity-60" />
                          <div className="absolute bottom-1 right-1">
                            <div className="bg-black/60 backdrop-blur-md text-white p-1.5 rounded-lg border border-white/10 shadow-lg">
                              <Sparkles className="w-4 h-4 text-yellow-400" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 w-full text-center md:text-left space-y-2">
                        <div>
                          <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 uppercase tracking-tight leading-none mb-1 drop-shadow-lg">
                            {currentPlayer.name}
                          </h2>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
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

                      </div>
                    </div>

                    {/* Player Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 my-4">
                      {Object.entries(currentPlayer.stats).map(([key, value]) => (
                        <div key={key} className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col items-center justify-center hover:bg-white/10 transition-all hover:scale-105 group/stat cursor-default">
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-0.5 group-hover/stat:text-cyan-400 transition-colors">{key.replace(/([A-Z])/g, " $1")}</span>
                          <span className="text-lg font-bold text-white font-mono">{String(value)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#0B0C15]/50 rounded-xl p-4 border border-white/5 space-y-4">
                      {/* Bidding Info */}
                      <div className="flex items-end justify-between border-b border-white/5 pb-3">
                        <div className="text-left">
                          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Base Price</p>
                          <p className="text-lg font-bold text-white/60">{formatPrice(currentPlayer.basePrice)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-1 animate-pulse">Current Bid</p>
                          <p className="text-3xl md:text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                            {formatPrice(currentBid)}
                          </p>
                        </div>
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
                        value={((room.timeLeft ?? 0) / (room.bidDuration || 15)) * 100}
                        className="h-2.5 bg-white/10"
                      />
                      <div className="text-white/70 text-sm mt-3">
                        {room.highestBidder ? `${room.bidDuration || 15} seconds for counter-bids` : `${room.bidDuration || 15} seconds initial timer`}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <Button
                        onClick={handleBid}
                        disabled={loading || !userTeam}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white text-base py-6 font-bold rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-emerald-500/30 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative flex items-center justify-center gap-2">
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                          BID {formatPrice(nextBidAmount)}
                        </span>
                      </Button>



                      {isHost && (
                        <Button
                          onClick={handleSkipPlayer}
                          disabled={loading}
                          className="bg-slate-700/50 hover:bg-slate-700 text-white py-6 px-6 font-bold rounded-lg border border-white/10 hover:border-white/30 transition-all duration-300 hover:shadow-lg hover:text-white group relative overflow-hidden"
                          title="Skip current player"
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            SKIP <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                <Card className="bg-[#121425]/60 backdrop-blur-xl border border-white/10 shadow-lg overflow-hidden">
                  <CardHeader className="bg-white/5 p-4 border-b border-white/5 flex flex-row items-center justify-between">
                    <CardTitle className="text-white text-base font-bold uppercase tracking-wide">Team Budgets</CardTitle>
                    <UsersIcon className="w-4 h-4 text-white/30" />
                  </CardHeader>
                  <CardContent className="p-0 max-h-[250px] overflow-y-auto custom-scrollbar">
                    <div className="divide-y divide-white/5">
                      {players.map((player) => {
                        const team = teams.find((t) => t.id === player.team)
                        const playerCount = Object.keys(player.players || {}).length
                        return (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-3 md:p-4 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {team && (
                                <div className="w-9 h-9 rounded-xl bg-[#0B0C15] border border-white/10 p-1.5 shadow-inner">
                                  <img
                                    src={team.logo || "/placeholder.svg"}
                                    alt={team.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-white font-bold text-sm truncate leading-none mb-1">
                                  {player.name}
                                </div>
                                <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider">{team?.name}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-emerald-400 font-mono font-bold text-sm">
                                {formatPrice(player.budget)}
                              </div>
                              <div className="text-white/40 text-[10px] font-bold">{playerCount}/25 Players</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#121425]/60 backdrop-blur-xl border border-white/10 shadow-lg overflow-hidden flex-1">
                  <CardHeader className="bg-white/5 p-4 border-b border-white/5 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-400" />
                      <CardTitle className="text-white text-base font-bold uppercase tracking-wide">
                        Live Leaderboard
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
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
                              className={`flex items-center justify-between p-3 md:p-4 transition-colors ${index === 0 ? "bg-gradient-to-r from-yellow-500/10 to-transparent" : "hover:bg-white/5"
                                }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`
                                flex items-center justify-center w-6 h-6 rounded font-bold text-[10px]
                                ${index === 0 ? "bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]" :
                                    index === 1 ? "bg-slate-300 text-black" :
                                      index === 2 ? "bg-amber-600 text-white" : "bg-white/10 text-white/50"}
                              `}>
                                  #{index + 1}
                                </div>
                                {team && (
                                  <div className="w-8 h-8 rounded-lg bg-[#0B0C15] border border-white/10 p-1">
                                    <img
                                      src={team.logo || "/placeholder.svg"}
                                      alt={team.name}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <span className="text-white font-bold text-sm truncate block leading-none mb-1">
                                    {player.name}
                                  </span>
                                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">{totalPoints} Pts</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-white/60 text-[10px] uppercase font-bold tracking-wider">Spent</div>
                                <div className="text-white font-mono font-bold text-xs">{formatPrice(spent)}</div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div >
          )}
        </div>

        {/* Chat Sidebar */}
        <div className={`fixed top-0 right-0 h-full w-[300px] transform transition-transform duration-300 z-50 shadow-2xl ${showChat ? 'translate-x-0' : 'translate-x-full'}`}>
          <ChatRoom roomId={gameData.id} userId={user.id} userName={user.name} onBack={() => setShowChat(false)} />
        </div>
      </div>
    </div>
  )
}

const getBiddingIncrement = (currentBid: number): number => {
  if (currentBid < 100) return 5 // Up to ₹1 crore: +₹5 lakh
  if (currentBid < 200) return 10 // ₹1-2 crore: +₹10 lakh
  if (currentBid < 500) return 20 // ₹2-5 crore: +₹20 lakh
  return 25 // ₹5+ crore: +₹25 lakh
}


