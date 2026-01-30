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
import { gameService } from "@/lib/game-service"

export default function IPLAuctionApp() {
  const [currentPage, setCurrentPage] = useState<"loading" | "login" | "home" | "lobby" | "game" | "gallery">("loading")
  const [user, setUser] = useState<any>(null)
  const [gameData, setGameData] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "Player",
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL,
        })

        // Restore session if exists
        const savedRoomId = localStorage.getItem("activeRoomId")
        if (savedRoomId) {
          try {
            // We can't easily get the full room object check synchronously, 
            // but we will optimistically set the gameData.
            // Ideally we should fetch the room to check status.
            // For now, let's just fetch it.
            gameService.subscribeToRoom(savedRoomId, (room) => {
              if (room) {
                setGameData(room)
                if (room.status === "auction" || room.status === "completed") {
                  setCurrentPage("game")
                } else if (room.status === "waiting" || room.status === "team-selection") {
                  setCurrentPage("lobby")
                } else {
                  setCurrentPage("home")
                  localStorage.removeItem("activeRoomId")
                }
              } else {
                // Room might be deleted or invalid
                setCurrentPage("home")
                localStorage.removeItem("activeRoomId")
              }
            })
            // Note: The subscribeToRoom returns an unsubscribe function. 
            // In this simple restore logic inside useEffect, handling the cleanup 
            // of this specific sub might be tricky if not careful.
            // A better approach might be to just set "home" initially 
            // and let the user re-join, BUT the requirement is to auto-join.
          } catch (e) {
            console.error("Failed to restore session", e)
            setCurrentPage("home")
          }
        } else {
          setCurrentPage("home")
        }

      } else {
        // Check for Guest Session first before showing login
        const guestUserStr = sessionStorage.getItem("guestUser")
        if (guestUserStr) {
          try {
            const guestUser = JSON.parse(guestUserStr)
            setUser(guestUser)

            // Re-join logic for guest
            const savedRoomId = localStorage.getItem("activeRoomId")
            if (savedRoomId) {
              gameService.subscribeToRoom(savedRoomId, (room) => {
                if (room) {
                  setGameData(room)
                  if (room.status === "auction" || room.status === "completed") {
                    setCurrentPage("game")
                  } else if (room.status === "waiting" || room.status === "team-selection") {
                    setCurrentPage("lobby")
                  } else {
                    setCurrentPage("home")
                  }
                } else {
                  setCurrentPage("home")
                }
              })
            } else {
              setCurrentPage("home")
            }
            return // Don't proceed to login timer
          } catch (e) {
            console.error("Failed to restore guest session", e)
          }
        }

        // Show loading for 3 seconds then go to login if no guest session
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
    if (userData.isGuest) {
      sessionStorage.setItem("guestUser", JSON.stringify(userData))
    }
    setCurrentPage("home")
  }

  const handleLogout = () => {
    auth.signOut()
    localStorage.removeItem("activeRoomId")
    sessionStorage.removeItem("guestUser")
    setCurrentPage("login")
  }

  const handleCreateRoom = (roomData: any) => {
    setGameData(roomData)
    localStorage.setItem("activeRoomId", roomData.id)
    setCurrentPage("lobby")
  }

  const handleJoinRoom = (roomData: any) => {
    setGameData(roomData)
    localStorage.setItem("activeRoomId", roomData.id)
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
          onBack={() => {
            setCurrentPage("home")
            localStorage.removeItem("activeRoomId")
          }}
        />
        <Toaster />
      </>
    )
  }

  if (currentPage === "game") {
    return (
      <>
        <AuctionGame gameData={gameData} user={user} onBack={() => {
          setCurrentPage("lobby")
          // Don't remove activeRoomId if going back to lobby, as they are still in the room context
          // But if they leave the lobby, then remove it.
        }} />
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
