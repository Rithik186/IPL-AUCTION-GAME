"use client"

import { database } from "./firebase"
import { ref, push, onValue, off, serverTimestamp, query, orderByChild, limitToLast } from "firebase/database"

export interface ChatMessage {
  id: string
  userId: string
  username: string
  text: string
  timestamp: number
  mentions?: string[]
  type: "text" | "system"
}

export interface TypingUser {
  userId: string
  username: string
  timestamp: number
}

class ChatService {
  sendMessage(roomId: string, userId: string, username: string, text: string): Promise<void> {
    const messagesRef = ref(database, `chatRooms/${roomId}/messages`)

    // Extract mentions (@username)
    const mentions = text.match(/@(\w+)/g)?.map((mention) => mention.substring(1)) || []

    return push(messagesRef, {
      userId,
      username,
      text,
      timestamp: serverTimestamp(),
      mentions,
      type: "text",
    }).then(() => {})
  }

  sendSystemMessage(roomId: string, text: string): Promise<void> {
    const messagesRef = ref(database, `chatRooms/${roomId}/messages`)

    return push(messagesRef, {
      userId: "system",
      username: "System",
      text,
      timestamp: serverTimestamp(),
      type: "system",
    }).then(() => {})
  }

  subscribeToMessages(roomId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const messagesRef = query(
      ref(database, `chatRooms/${roomId}/messages`),
      orderByChild("timestamp"),
      limitToLast(100), // Last 100 messages
    )

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messagesData = snapshot.val()
      if (messagesData) {
        const messages = Object.entries(messagesData).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        })) as ChatMessage[]
        callback(messages)
      } else {
        callback([])
      }
    })

    return () => off(messagesRef, "value", unsubscribe)
  }

  setTyping(roomId: string, userId: string, username: string, isTyping: boolean): Promise<void> {
    const typingRef = ref(database, `chatRooms/${roomId}/typing/${userId}`)

    if (isTyping) {
      return push(typingRef, {
        userId,
        username,
        timestamp: serverTimestamp(),
      }).then(() => {})
    } else {
      return push(typingRef, null).then(() => {})
    }
  }

  subscribeToTyping(roomId: string, callback: (typingUsers: TypingUser[]) => void): () => void {
    const typingRef = ref(database, `chatRooms/${roomId}/typing`)

    const unsubscribe = onValue(typingRef, (snapshot) => {
      const typingData = snapshot.val()
      if (typingData) {
        const now = Date.now()
        const typingUsers = Object.values(typingData)
          .filter((user: any) => user && now - user.timestamp < 3000) // 3 seconds timeout
          .map((user: any) => ({
            userId: user.userId,
            username: user.username,
            timestamp: user.timestamp,
          })) as TypingUser[]
        callback(typingUsers)
      } else {
        callback([])
      }
    })

    return () => off(typingRef, "value", unsubscribe)
  }

  clearChat(roomId: string): Promise<void> {
    const chatRoomRef = ref(database, `chatRooms/${roomId}`)
    return push(chatRoomRef, null).then(() => {})
  }
}

export const chatService = new ChatService()
