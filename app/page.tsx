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
import { Toaster } from "@/components/toaster"

export default function IPLAuctionApp() {
  const [currentPage, setCurrentPage] = useState<"loading" | "login" | "home" | "lobby" | "game">("loading")
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

  if (currentPage === "loading") {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-800 flex items-center justify-center relative"
        style={{
          backgroundImage: "url('/bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <Card className="w-96 bg-white/10 backdrop-blur-md border-white/20 relative z-10">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <img src="/placeholder-hes4w.png" alt="IPL Auction" className="w-24 h-24 mx-auto mb-4 rounded-full" />
              <h1 className="text-3xl font-bold text-white mb-2">IPL AUCTION</h1>
              <p className="text-white/80">Ultimate Cricket Auction Experience</p>
            </div>
            <div className="flex items-center justify-center space-x-2 text-white">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading...</span>
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
        <HomePage user={user} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
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

  return <Toaster />
}
