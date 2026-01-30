import { database } from "./firebase"
import { ref, push, set, onValue, off, update, remove } from "firebase/database"
import type { Player } from "./players-data"
import { playersDatabase } from "./players-data"

export interface GameRoom {
  id: string
  name: string
  hostId: string
  players: { [key: string]: GamePlayer }
  maxPlayers: number
  status: "waiting" | "team-selection" | "auction" | "completed" | "closed"
  currentPlayer?: Player
  currentBid?: number
  highestBidder?: string
  timeLeft?: number
  auctionPhase?: AuctionPhase
  playerIndex?: number
  soldPlayers?: { [key: string]: { player: Player; price: number; team: string } }
  unsoldPlayers?: string[]
  roundShown?: { [key: string]: boolean }
  biddingWar?: { team1: string; team2: string; player: string } | null
  quitBidders?: string[]
  finalLeaderboard?: { teamName: string; totalPoints: number; playersCount: number; totalSpent: number }[] // Added final leaderboard
  auctionMode?: "traditional" | "fast" // Added auction mode
  shuffledPhasePlayers?: { [key in AuctionPhase]?: string[] }; // New field for randomized player order per phase
  bidDuration?: number // Custom timer duration
  isPaused?: boolean
}

export interface GamePlayer {
  id: string
  name: string
  email: string
  avatar?: string
  team?: string
  budget: number
  players: { [key: string]: { player: Player; price: number } }
  isReady: boolean
  playingXI?: string[]
  captainId?: string | null
  viceCaptainId?: string | null
}

export interface Team {
  id: string
  name: string
  logo: string
  color: string
}

export const teams: Team[] = [
  {
    id: "mi",
    name: "Mumbai Indians",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/1200px-Mumbai_Indians_Logo.svg.png",
    color: "bg-blue-600",
  },
  {
    id: "csk",
    name: "Chennai Super Kings",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Chennai_Super_Kings_Logo.svg/1200px-Chennai_Super_Kings_Logo.svg.png",
    color: "bg-yellow-500",
  },
  {
    id: "rcb",
    name: "Royal Challengers Bengaluru",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Royal_Challengers_Bengaluru_Logo.svg/1200px-Royal_Challengers_Bengaluru_Logo.svg.png",
    color: "bg-red-600",
  },
  {
    id: "kkr",
    name: "Kolkata Knight Riders",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Kolkata_Knight_Riders_Logo.svg/1200px-Kolkata_Knight_Riders_Logo.svg.png",
    color: "bg-purple-600",
  },
  {
    id: "dc",
    name: "Delhi Capitals",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/Delhi_Capitals.svg/1200px-Delhi_Capitals.svg.png",
    color: "bg-blue-500",
  },
  {
    id: "rr",
    name: "Rajasthan Royals",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg/1200px-This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg.png",
    color: "bg-pink-600",
  },
  {
    id: "srh",
    name: "Sunrisers Hyderabad",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/51/Sunrisers_Hyderabad_Logo.svg/1200px-Sunrisers_Hyderabad_Logo.svg.png",
    color: "bg-orange-600",
  },
  {
    id: "pbks",
    name: "Punjab Kings",
    logo: "https://upload.wikimedia.org/wikipedia/en/d/d4/Punjab_Kings_Logo.svg",
    color: "bg-red-500",
  },
  {
    id: "gt",
    name: "Gujarat Titans",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Gujarat_Titans_Logo.svg/1200px-Gujarat_Titans_Logo.svg.png",
    color: "bg-blue-800",
  },
  {
    id: "lsg",
    name: "Lucknow Super Giants",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/Lucknow_Super_Giants_IPL_Logo.svg/1200px-Lucknow_Super_Giants_IPL_Logo.svg.png",
    color: "bg-cyan-500",
  },
]

export type AuctionPhase = "batsman" | "bowler" | "all-rounder" | "wicket-keeper"

class GameService {
  private shuffleArray<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
  }

  private getBiddingIncrement(currentBid: number): number {
    if (currentBid < 100) return 5 // Up to ₹1 crore: +₹5 lakh
    if (currentBid < 200) return 10 // ₹1-2 crore: +₹10 lakh
    if (currentBid < 500) return 20 // ₹2-5 crore: +₹20 lakh
    return 25 // ₹5+ crore: +₹25 lakh
  }

  public getCurrentPlayer(room: GameRoom, auctionPhase: AuctionPhase, playerIndex: number): Player | null {
    const soldPlayerIds = new Set(Object.keys(room.soldPlayers || {}))
    const unsoldPlayerIds = new Set(room.unsoldPlayers || [])
    const shuffledPlayerIdsForPhase = room.shuffledPhasePlayers?.[auctionPhase] || [];

    // Filter out sold AND unsold players from the shuffled list
    const availablePlayerIdsInPhase = shuffledPlayerIdsForPhase.filter(
      (playerId) => !soldPlayerIds.has(playerId) && !unsoldPlayerIds.has(playerId)
    );

    const currentPlayerId = availablePlayerIdsInPhase[playerIndex];
    return currentPlayerId ? (playersDatabase.find((p) => p.id === currentPlayerId) || null) : null
  }

  private getNextPhase(currentPhase: AuctionPhase): AuctionPhase | null {
    const phases = ["batsman", "bowler", "all-rounder", "wicket-keeper"] as const
    const currentIndex = phases.indexOf(currentPhase)
    return currentIndex < phases.length - 1 ? phases[currentIndex + 1] : null
  }

  private getRandomNextPlayer(room: GameRoom): Player | null {
    const sold = new Set(Object.keys(room.soldPlayers || {}))
    const unsold = new Set(room.unsoldPlayers || [])
    const remaining = playersDatabase.filter(
      (p) => !sold.has(p.id) && !unsold.has(p.id) && room.currentPlayer?.id !== p.id,
    )
    if (remaining.length === 0) return null
    const idx = Math.floor(Math.random() * remaining.length)
    return remaining[idx]
  }

  private calculateFinalLeaderboard(players: { [key: string]: GamePlayer }): {
    teamName: string
    totalPoints: number
    playersCount: number
    totalSpent: number
  }[] {
    const leaderboard = Object.values(players).map((player) => {
      const team = teams.find((t) => t.id === player.team)
      const playersList = Object.values(player.players || {})
      const totalPoints = playersList.reduce((sum, p) => sum + (p.player.points || 0), 0)
      const totalSpent = 12000 - player.budget // 120 Cr - remaining budget

      return {
        teamName: team?.name || player.name,
        totalPoints,
        playersCount: playersList.length,
        totalSpent,
      }
    })

    return leaderboard.sort((a, b) => b.totalPoints - a.totalPoints)
  }

  createRoom(roomName: string, hostId: string, hostName: string, hostEmail: string, hostAvatar?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const generateRoomId = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let result = ""
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }

      const roomId = generateRoomId()
      const newRoomRef = ref(database, `rooms/${roomId}`)

      const roomData: GameRoom = {
        id: roomId,
        name: roomName,
        hostId,
        players: {
          [hostId]: {
            id: hostId,
            name: hostName,
            email: hostEmail,
            avatar: hostAvatar,
            budget: 12000, // 120 crores in lakhs (increased from 100 Cr)
            players: {},
            isReady: false,
          },
        },
        maxPlayers: 15,
        status: "waiting",
      }

      set(newRoomRef, roomData)
        .then(() => resolve(roomId))
        .catch(reject)
    })
  }

  joinRoom(roomId: string, playerId: string, playerName: string, playerEmail: string, playerAvatar?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const roomRef = ref(database, `rooms/${roomId}`)

      onValue(
        roomRef,
        (snapshot) => {
          const room = snapshot.val() as GameRoom
          if (!room) {
            reject(new Error("Room not found"))
            return
          }

          const existingPlayer = room.players ? room.players[playerId] : null

          // Check for room capacity only if it's a NEW player
          if (!existingPlayer && room.players && Object.keys(room.players).length >= room.maxPlayers) {
            reject(new Error("Room is full"))
            return
          }

          let playerData: GamePlayer

          if (existingPlayer) {
            // Player exists: Update profile info but PRESERVE game state
            playerData = {
              ...existingPlayer,
              name: playerName,
              email: playerEmail,
              avatar: playerAvatar,
              // Explicitly ensure critical fields are preserved if they were somehow missing in local snapshot but present in DB (redundant but safe)
              budget: existingPlayer.budget ?? 12000,
              players: existingPlayer.players || {},
              isReady: existingPlayer.isReady,
              team: existingPlayer.team, // Preserve team selection
              playingXI: existingPlayer.playingXI || [],
              captainId: existingPlayer.captainId || null,
              viceCaptainId: existingPlayer.viceCaptainId || null
            }
          } else {
            // New Player: Initialize default state
            playerData = {
              id: playerId,
              name: playerName,
              email: playerEmail,
              avatar: playerAvatar,
              budget: 12000, // 120 crores in lakhs
              players: {},
              isReady: false,
              playingXI: [],
              captainId: null,
              viceCaptainId: null
            }
          }

          update(ref(database, `rooms/${roomId}/players/${playerId}`), playerData)
            .then(() => resolve())
            .catch(reject)
        },
        { onlyOnce: true },
      )
    })
  }

  selectTeam(roomId: string, playerId: string, teamId: string): Promise<void> {
    return update(ref(database, `rooms/${roomId}/players/${playerId}`), {
      team: teamId,
      isReady: true,
    })
  }

  startAuction(roomId: string): Promise<void> {
    const initialPhase: AuctionPhase = "batsman"

    const shuffledPhasePlayers: { [key in AuctionPhase]?: string[] } = {};
    const phases: AuctionPhase[] = ["batsman", "bowler", "all-rounder", "wicket-keeper"];

    phases.forEach(phase => {
      let playersInPhase = playersDatabase.filter((p) => {
        if (phase === "batsman") return p.role === "Batsman";
        if (phase === "bowler") return p.role === "Bowler";
        if (phase === "all-rounder") return p.role === "All-Rounder";
        if (phase === "wicket-keeper") return p.role === "Wicket-Keeper";
        return false;
      }).map(p => p.id);
      shuffledPhasePlayers[phase] = this.shuffleArray(playersInPhase);
    });

    const initialPlayerId = shuffledPhasePlayers[initialPhase]?.[0];
    const foundPlayer = initialPlayerId ? playersDatabase.find(p => p.id === initialPlayerId) : null; // Explicitly set to null if not found
    const defaultDuration = 15;

    return update(ref(database, `rooms/${roomId}`), {
      status: "auction",
      auctionPhase: initialPhase,
      auctionMode: "traditional", // Default to traditional unless host switches
      playerIndex: 0,
      timeLeft: defaultDuration,
      bidDuration: defaultDuration,
      currentPlayer: foundPlayer,
      currentBid: foundPlayer?.basePrice || 0,
      highestBidder: null,
      soldPlayers: {},
      unsoldPlayers: [],
      roundShown: {},
      biddingWar: null,
      quitBidders: [],

      shuffledPhasePlayers: shuffledPhasePlayers, // Store the shuffled lists
      isPaused: false,
    })
  }

  endAuction(roomId: string, hostId: string): Promise<void> {
    const roomRef = ref(database, `rooms/${roomId}`)

    return new Promise((resolve, reject) => {
      onValue(
        roomRef,
        (snapshot) => {
          const room = snapshot.val() as GameRoom
          if (!room) {
            reject(new Error("Room not found"))
            return
          }

          if (room.hostId !== hostId) {
            reject(new Error("Only host can end the auction"))
            return
          }

          const finalLeaderboard = this.calculateFinalLeaderboard(room.players)

          update(ref(database, `rooms/${roomId}`), {
            status: "completed",
            finalLeaderboard,
          })
            .then(() => resolve())
            .catch(reject)
        },
        { onlyOnce: true },
      )
    })
  }

  placeBid(roomId: string, playerId: string, bidAmount: number): Promise<void> {
    const roomRef = ref(database, `rooms/${roomId}`)

    return new Promise((resolve, reject) => {
      onValue(
        roomRef,
        (snapshot) => {
          const room = snapshot.val() as GameRoom
          if (!room || !room.currentPlayer) {
            reject(new Error("No current player available"))
            return
          }

          const currentBid = room.currentBid || room.currentPlayer.basePrice
          const increment = this.getBiddingIncrement(currentBid)
          const expectedBid = room.highestBidder ? currentBid + increment : room.currentPlayer.basePrice

          if (bidAmount !== expectedBid) {
            reject(new Error(`Invalid bid amount. Expected: ₹${expectedBid}L`))
            return
          }

          const updates: any = {
            currentBid: bidAmount,
            highestBidder: playerId,
            timeLeft: room.bidDuration || 15, // Reset based on bidDuration
            quitBidders: [], // Reset quit bidders on new bid
          }

          if (room.highestBidder && room.highestBidder !== playerId) {
            const previousBidder = room.players[room.highestBidder]
            const currentBidder = room.players[playerId]
            if (previousBidder && currentBidder) {
              updates.biddingWar = {
                team1: previousBidder.name,
                team2: currentBidder.name,
                player: room.currentPlayer.name,
              }
            }
          }

          update(ref(database, `rooms/${roomId}`), updates)
            .then(() => resolve())
            .catch(reject)
        },
        { onlyOnce: true },
      )
    })
  }

  quitBid(roomId: string, playerId: string): Promise<void> {
    const roomRef = ref(database, `rooms/${roomId}`)

    return new Promise((resolve, reject) => {
      onValue(
        roomRef,
        async (snapshot) => {
          const room = snapshot.val() as GameRoom
          if (!room || !room.highestBidder || !room.currentBid) {
            reject(new Error("No active bidding to quit"))
            return
          }

          // Immediately sell to highest bidder - this will trigger the sold overlay for all users
          try {
            const highestBidderTeam = room.players[room.highestBidder]?.team
            if (highestBidderTeam) {
              await this.sellPlayer(roomId, room.highestBidder, room.currentBid, highestBidderTeam)
            }
            resolve()
          } catch (error) {
            reject(error)
          }
        },
        { onlyOnce: true },
      )
    })
  }

  markPlayerUnsold(roomId: string): Promise<void> {
    const roomRef = ref(database, `rooms/${roomId}`)

    return new Promise((resolve, reject) => {
      onValue(
        roomRef,
        (snapshot) => {
          const room = snapshot.val() as GameRoom
          if (!room || !room.currentPlayer) {
            reject(new Error("No current player to mark unsold"))
            return
          }

          const unsoldPlayers = room.unsoldPlayers || []
          unsoldPlayers.push(room.currentPlayer.id)

          const currentPlayerIndex = room.playerIndex || 0
          const nextIndex = currentPlayerIndex // Don't increment index as unsold player is removed from the filtered list, shifting everyone
          const currentPhase: AuctionPhase = (room.auctionPhase as AuctionPhase) || "batsman"

          let nextPlayer = this.getCurrentPlayer(room, currentPhase, nextIndex)
          let nextPhase: AuctionPhase = currentPhase

          // Logic to recycle/reshuffle if we reached end of list but still have available skipped players
          if (!nextPlayer) {
            const soldPlayerIds = new Set(Object.keys(room.soldPlayers || {}))
            const unsoldPlayerIds = new Set(room.unsoldPlayers || [])
            const shuffledPlayerIdsForPhase = room.shuffledPhasePlayers?.[currentPhase] || [];
            const availableCount = shuffledPlayerIdsForPhase.filter(
              (playerId) => !soldPlayerIds.has(playerId) && !unsoldPlayerIds.has(playerId)
            ).length;

            if (availableCount > 0) {
              const playersInPhase = shuffledPlayerIdsForPhase.filter(
                (playerId) => !soldPlayerIds.has(playerId) && !unsoldPlayerIds.has(playerId)
              );
              const newShuffledList = this.shuffleArray(playersInPhase);
              const updatedShuffledPhasePlayers = { ...(room.shuffledPhasePlayers || {}), [currentPhase]: newShuffledList };
              nextPlayer = playersDatabase.find(p => p.id === newShuffledList[0]) || null;

              update(ref(database, `rooms/${roomId}`), {
                playerIndex: 0,
                shuffledPhasePlayers: updatedShuffledPhasePlayers,
                currentPlayer: nextPlayer,
                currentBid: nextPlayer?.basePrice || 0,
                timeLeft: room.bidDuration || 15,
                highestBidder: null,
                unsoldPlayers,
                biddingWar: null,
                quitBidders: [],
              }).then(() => resolve()).catch(reject);
              return;
            }
          }

          const isFast = room.auctionMode === "fast"
          if (isFast) {
            nextPlayer = this.getRandomNextPlayer(room)
            nextPhase = currentPhase // phase label becomes irrelevant in fast mode
          } else if (!nextPlayer) {
            const newPhase = this.getNextPhase(currentPhase)
            if (newPhase) {
              nextPhase = newPhase
              nextPlayer = this.getCurrentPlayer(room, newPhase, 0)
            } else {
              const finalLeaderboard = this.calculateFinalLeaderboard(room.players)
              update(ref(database, `rooms/${roomId}`), {
                status: "completed",
                unsoldPlayers,
                finalLeaderboard,
              })
                .then(() => resolve())
                .catch(reject)
              return
            }
          }

          update(ref(database, `rooms/${roomId}`), {
            playerIndex: isFast
              ? (room.playerIndex || 0) + 1
              : nextPlayer
                ? nextPhase === currentPhase
                  ? nextIndex
                  : 0
                : currentPlayerIndex,
            auctionPhase: nextPhase,
            currentPlayer: nextPlayer,
            currentBid: nextPlayer?.basePrice || 0,
            timeLeft: room.bidDuration || 15,
            highestBidder: null,
            unsoldPlayers,
            biddingWar: null,
            quitBidders: [],
          })
            .then(() => resolve())
            .catch(reject)
        },
        { onlyOnce: true },
      )
    })
  }

  markRoundShown(roomId: string, phase: AuctionPhase): Promise<void> {
    const roomRef = ref(database, `rooms/${roomId}`)

    return new Promise((resolve, reject) => {
      onValue(
        roomRef,
        (snapshot) => {
          const room = snapshot.val() as GameRoom
          if (!room) {
            reject(new Error("Room not found"))
            return
          }

          const roundShown = room.roundShown || {}
          roundShown[phase] = true

          update(ref(database, `rooms/${roomId}`), {
            roundShown,
          })
            .then(() => resolve())
            .catch(reject)
        },
        { onlyOnce: true },
      )
    })
  }

  sellPlayer(roomId: string, playerId: string, price: number, teamId: string): Promise<void> {
    const roomRef = ref(database, `rooms/${roomId}`)

    return new Promise((resolve, reject) => {
      onValue(
        roomRef,
        (snapshot) => {
          const room = snapshot.val() as GameRoom
          if (!room || !room.currentPlayer) {
            reject(new Error("No current player to sell"))
            return
          }

          const buyer = room.players[playerId]
          if (!buyer) {
            reject(new Error("Buyer not found"))
            return
          }

          if (buyer.budget < price) {
            reject(new Error(`Insufficient budget. Available: ₹${buyer.budget}L, Required: ₹${price}L`))
            return
          }

          const newBudget = buyer.budget - price

          const soldPlayers = room.soldPlayers || {}
          soldPlayers[room.currentPlayer.id] = {
            player: room.currentPlayer,
            price,
            team: teamId,
          }

          const buyerPlayers = buyer.players || {}
          buyerPlayers[room.currentPlayer.id] = {
            player: room.currentPlayer,
            price,
          }

          const currentPlayerIndex = room.playerIndex || 0
          const nextIndex = currentPlayerIndex // Keep same index because sold player is removed from the filtered list, shifting everyone
          const currentPhase: AuctionPhase = (room.auctionPhase as AuctionPhase) || "batsman"

          let nextPlayer = this.getCurrentPlayer(room, currentPhase, nextIndex)
          let nextPhase: AuctionPhase = currentPhase

          // Logic to recycle/reshuffle if we reached end of list but still have available skipped players
          if (!nextPlayer) {
            const soldPlayerIds = new Set(Object.keys(room.soldPlayers || {}))
            const unsoldPlayerIds = new Set(room.unsoldPlayers || [])
            const shuffledPlayerIdsForPhase = room.shuffledPhasePlayers?.[currentPhase] || [];
            const availableCount = shuffledPlayerIdsForPhase.filter(
              (playerId) => !soldPlayerIds.has(playerId) && !unsoldPlayerIds.has(playerId)
            ).length;

            if (availableCount > 0) {
              const playersInPhase = shuffledPlayerIdsForPhase.filter(
                (playerId) => !soldPlayerIds.has(playerId) && !unsoldPlayerIds.has(playerId)
              );
              const newShuffledList = this.shuffleArray(playersInPhase);
              const updatedShuffledPhasePlayers = { ...(room.shuffledPhasePlayers || {}), [currentPhase]: newShuffledList };
              nextPlayer = playersDatabase.find(p => p.id === newShuffledList[0]) || null;

              const updates_recycle: any = {
                [`players/${playerId}/budget`]: newBudget,
                [`players/${playerId}/players`]: buyerPlayers,
                soldPlayers,
                playerIndex: 0,
                shuffledPhasePlayers: updatedShuffledPhasePlayers,
                currentPlayer: nextPlayer,
                currentBid: nextPlayer?.basePrice || 0,
                timeLeft: room.bidDuration || 15,
                highestBidder: null,
                biddingWar: null,
                quitBidders: [],
              }
              update(ref(database, `rooms/${roomId}`), updates_recycle)
                .then(() => resolve())
                .catch(reject)
              return;
            }
          }

          const isFast = room.auctionMode === "fast"
          if (isFast) {
            nextPlayer = this.getRandomNextPlayer(room)
            nextPhase = currentPhase
          } else if (!nextPlayer) {
            const newPhase = this.getNextPhase(currentPhase)
            if (newPhase) {
              nextPhase = newPhase
              nextPlayer = this.getCurrentPlayer(room, newPhase, 0)
            } else {
              const finalLeaderboard = this.calculateFinalLeaderboard(room.players)
              const updates: any = {
                [`players/${playerId}/budget`]: newBudget,
                [`players/${playerId}/players`]: buyerPlayers,
                soldPlayers,
                status: "completed",
                finalLeaderboard,
              }

              update(ref(database, `rooms/${roomId}`), updates)
                .then(() => resolve())
                .catch(reject)
              return
            }
          }

          const updates: any = {
            [`players/${playerId}/budget`]: newBudget,
            [`players/${playerId}/players`]: buyerPlayers,
            soldPlayers,
            playerIndex: isFast
              ? (room.playerIndex || 0) + 1
              : nextPlayer
                ? nextPhase === currentPhase
                  ? nextIndex
                  : 0
                : currentPlayerIndex,
            auctionPhase: nextPhase,
            currentPlayer: nextPlayer,
            currentBid: nextPlayer?.basePrice || 0,
            timeLeft: room.bidDuration || 15,
            highestBidder: null,
            biddingWar: null,
            quitBidders: [],
          }

          update(ref(database, `rooms/${roomId}`), updates)
            .then(() => resolve())
            .catch(reject)
        },
        { onlyOnce: true },
      )
    })
  }

  updateTimer(roomId: string, timeLeft: number): Promise<void> {
    return update(ref(database, `rooms/${roomId}`), {
      timeLeft,
    })
  }

  subscribeToRoom(roomId: string, callback: (room: GameRoom | null) => void): () => void {
    const roomRef = ref(database, `rooms/${roomId}`)

    const unsubscribe = onValue(roomRef, (snapshot) => {
      const room = snapshot.val() as GameRoom | null
      callback(room)
    })

    return () => off(roomRef, "value", unsubscribe)
  }

  leaveRoom(roomId: string, playerId: string): Promise<void> {
    return remove(ref(database, `rooms/${roomId}/players/${playerId}`))
  }

  deleteRoom(roomId: string): Promise<void> {
    return remove(ref(database, `rooms/${roomId}`))
  }

  closeRoom(roomId: string): Promise<void> {
    return update(ref(database, `rooms/${roomId}`), {
      status: "closed",
    })
  }

  clearCompletedRoomData(roomId: string, hostId: string): Promise<void> {
    const roomRef = ref(database, `rooms/${roomId}`)
    return new Promise((resolve, reject) => {
      onValue(roomRef, (snapshot) => {
        const room = snapshot.val() as GameRoom
        if (!room) {
          reject(new Error("Room not found"))
          return
        }
        if (room.hostId !== hostId) {
          reject(new Error("Only host can clear room data"))
          return
        }
        if (room.status !== "completed") {
          reject(new Error("Room is not completed yet"))
          return
        }
        remove(roomRef)
          .then(() => resolve())
          .catch(reject)
      }, { onlyOnce: true })
    })
  }

  skipPlayer(roomId: string): Promise<void> {
    const roomRef = ref(database, `rooms/${roomId}`)

    return new Promise((resolve, reject) => {
      onValue(
        roomRef,
        (snapshot) => {
          const room = snapshot.val() as GameRoom
          // Don't add to unsoldPlayers, just skip

          const currentPlayerIndex = room.playerIndex || 0
          const nextIndex = currentPlayerIndex + 1
          const currentPhase: AuctionPhase = (room.auctionPhase as AuctionPhase) || "batsman"

          let nextPlayer = this.getCurrentPlayer(room, currentPhase, nextIndex)
          let nextPhase: AuctionPhase = currentPhase

          // Logic to recycle/reshuffle if we reached end of list but still have available skipped players
          if (!nextPlayer) {
            const soldPlayerIds = new Set(Object.keys(room.soldPlayers || {}))
            const unsoldPlayerIds = new Set(room.unsoldPlayers || [])
            const shuffledPlayerIdsForPhase = room.shuffledPhasePlayers?.[currentPhase] || [];
            const availableCount = shuffledPlayerIdsForPhase.filter(
              (playerId) => !soldPlayerIds.has(playerId) && !unsoldPlayerIds.has(playerId)
            ).length;

            if (availableCount > 0) {
              // Restart Phase with Reshuffle!
              const playersInPhase = shuffledPlayerIdsForPhase.filter(
                (playerId) => !soldPlayerIds.has(playerId) && !unsoldPlayerIds.has(playerId)
              );
              const newShuffledList = this.shuffleArray(playersInPhase);

              // Update the shuffle map directly in the DB update payload via shuffledPhasePlayers
              const updatedShuffledPhasePlayers = { ...(room.shuffledPhasePlayers || {}), [currentPhase]: newShuffledList };

              nextPlayer = playersDatabase.find(p => p.id === newShuffledList[0]) || null;

              update(ref(database, `rooms/${roomId}`), {
                playerIndex: 0,
                shuffledPhasePlayers: updatedShuffledPhasePlayers,
                currentPlayer: nextPlayer,
                currentBid: nextPlayer?.basePrice || 0,
                timeLeft: room.bidDuration || 15,
                highestBidder: null,
                biddingWar: null,
                quitBidders: [],
              }).then(() => resolve()).catch(reject);
              return;
            }
          }

          // Normal Next Player Logic (or Phase Change if truly empty)
          const isFast = room.auctionMode === "fast"
          if (isFast) {
            nextPlayer = this.getRandomNextPlayer(room)
            nextPhase = currentPhase // phase label becomes irrelevant in fast mode
          } else if (!nextPlayer) {
            const newPhase = this.getNextPhase(currentPhase)
            if (newPhase) {
              nextPhase = newPhase

              // We must also do the initial shuffle for the new phase here to ensure randomness (per user req)
              // Actually startAuction pre-shuffles, but we want re-shuffle on entry?
              // The user said "each time when he switches , start from different player order" -> That's covered by changePhase explicitly.
              // But here we are auto-switching phase?
              // The original code just did `this.getCurrentPlayer(room, newPhase, 0)`.
              // We should probably rely on the pre-shuffled list for auto-transition or better yet, reshuffle here too.
              // Let's stick to using standard flow for now to minimize risk errors.

              nextPlayer = this.getCurrentPlayer(room, newPhase, 0)
            } else {
              const finalLeaderboard = this.calculateFinalLeaderboard(room.players)
              update(ref(database, `rooms/${roomId}`), {
                status: "completed",
                finalLeaderboard,
              })
                .then(() => resolve())
                .catch(reject)
              return
            }
          }

          update(ref(database, `rooms/${roomId}`), {
            playerIndex: isFast
              ? (room.playerIndex || 0) + 1
              : nextPlayer
                ? nextPhase === currentPhase
                  ? nextIndex
                  : 0
                : currentPlayerIndex,
            auctionPhase: nextPhase,
            currentPlayer: nextPlayer,
            currentBid: nextPlayer?.basePrice || 0,
            timeLeft: room.bidDuration || 15,
            highestBidder: null,
            biddingWar: null,
            quitBidders: [],
          })
            .then(() => resolve())
            .catch(reject)
        },
        { onlyOnce: true },
      )
    })
  }

  setAuctionMode(roomId: string, mode: "traditional" | "fast"): Promise<void> {
    return update(ref(database, `rooms/${roomId}`), { auctionMode: mode })
  }

  changePhase(roomId: string, phase: AuctionPhase): Promise<void> {
    return new Promise((resolve, reject) => {
      onValue(ref(database, `rooms/${roomId}`), (snapshot) => {
        const room = snapshot.val() as GameRoom
        if (!room) {
          reject(new Error("Room not found"))
          return
        }
        const soldPlayerIds = new Set(Object.keys(room.soldPlayers || {}))
        const unsoldPlayerIds = new Set(room.unsoldPlayers || [])

        // shuffling logic for the new phase
        // shuffling logic for the new phase
        let playersInPhase = playersDatabase.filter((p) => {
          if (phase === "batsman") return p.role === "Batsman";
          if (phase === "bowler") return p.role === "Bowler";
          if (phase === "all-rounder") return p.role === "All-Rounder";
          if (phase === "wicket-keeper") return p.role === "Wicket-Keeper";
          return false;
        }).map(p => p.id).filter(id => !soldPlayerIds.has(id) && !unsoldPlayerIds.has(id));

        const newShuffledList = this.shuffleArray(playersInPhase);

        const shuffledPhasePlayers = room.shuffledPhasePlayers || {};
        shuffledPhasePlayers[phase] = newShuffledList;

        // Since we reshuffled unsold players, the new list contains ONLY unsold players. 
        // We can just pick the first one.
        const nextPlayerId = newShuffledList[0];
        const nextPlayer = nextPlayerId ? playersDatabase.find(p => p.id === nextPlayerId) || null : null;

        update(ref(database, `rooms/${roomId}`), {
          auctionPhase: phase,
          shuffledPhasePlayers, // Save the new shuffle
          playerIndex: 0,
          currentPlayer: nextPlayer,
          currentBid: nextPlayer?.basePrice || 0,
          highestBidder: null,
          timeLeft: room.bidDuration || 15,
          biddingWar: null,
          quitBidders: [],
        })
          .then(() => resolve())
          .catch(reject)
      }, { onlyOnce: true })
    })
  }

  togglePause(roomId: string, isPaused: boolean): Promise<void> {
    return update(ref(database, `rooms/${roomId}`), { isPaused })
  }

  setBidDuration(roomId: string, duration: number): Promise<void> {
    return update(ref(database, `rooms/${roomId}`), { bidDuration: duration })
  }

  updatePlayingXI(roomId: string, playerId: string, playingXI: string[], captainId: string | null, viceCaptainId: string | null): Promise<void> {
    return update(ref(database, `rooms/${roomId}/players/${playerId}`), {
      playingXI,
      captainId,
      viceCaptainId
    })
  }
}


export const gameService = new GameService()
