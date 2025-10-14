"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import LoginPage from "@/components/login-page"
import HomePage from "@/components/home-page"
import GameLobby from "@/components/game-lobby"
import AuctionGame from "@/components/auction-game"
import DomeGallery from "@/components/DomeGallery"
import { Toaster } from "@/components/toaster"

export default function IPLAuctionApp() {
  const [currentPage, setCurrentPage] = useState<"loading" | "login" | "home" | "lobby" | "game" | "gallery">("loading")
  const [user, setUser] = useState<any>(null)
  const [gameData, setGameData] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "Player",
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL,
        })
        setCurrentPage("home")
      } else {
        // Show loading for 3 seconds then go to login
        const timer = setTimeout(() => {
          setCurrentPage("login")
        }, 3000)

        return () => clearTimeout(timer)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogin = (userData: any) => {
    setUser(userData)
    setCurrentPage("home")
  }

  const handleLogout = () => {
    auth.signOut()
    setCurrentPage("login")
  }

  const handleCreateRoom = (roomData: any) => {
    setGameData(roomData)
    setCurrentPage("lobby")
  }

  const handleJoinRoom = (roomData: any) => {
    setGameData(roomData)
    setCurrentPage("lobby")
  }

  const handleStartGame = () => {
    setCurrentPage("game")
  }

  const handleGoToGallery = () => {
    setCurrentPage("gallery")
  }

  if (currentPage === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-[320px] h-[320px] rounded-full bg-blue-600/15 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-[360px] h-[360px] rounded-full bg-amber-500/15 blur-3xl" />
        </div>
        <Card className="w-96 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-float">
          <CardContent className="p-12 text-center">
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto mb-6 relative grid place-items-center">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-amber-500 rounded-full animate-spin-slow"></div>
                <div className="w-28 h-28 rounded-full bg-slate-900"></div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 to-amber-300 bg-clip-text text-transparent mb-3">
                IPL Auction
              </h1>
              <p className="text-white/70 text-lg">Ultimate Cricket Auction Experience</p>
            </div>
            <div className="flex items-center justify-center space-x-3 text-white/80">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <span className="text-lg font-medium">Loading your experience...</span>
            </div>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    )
  }

  if (currentPage === "login") {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster />
      </>
    )
  }

  if (currentPage === "home") {
    return (
      <>
        <HomePage
          user={user}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLogout={handleLogout}
          onGoToGallery={handleGoToGallery}
        />
        <Toaster />
      </>
    )
  }

  if (currentPage === "lobby") {
    return (
      <>
        <GameLobby
          gameData={gameData}
          user={user}
          onStartGame={handleStartGame}
          onBack={() => setCurrentPage("home")}
        />
        <Toaster />
      </>
    )
  }

  if (currentPage === "game") {
    return (
      <>
        <AuctionGame gameData={gameData} user={user} onBack={() => setCurrentPage("lobby")} />
        <Toaster />
      </>
    )
  }

  if (currentPage === "gallery") {
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <DomeGallery onBack={() => setCurrentPage("home")} />
      </div>
    )
  }

  return <Toaster />
}
