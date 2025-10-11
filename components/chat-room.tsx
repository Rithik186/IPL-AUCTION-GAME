"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageCircle, Smile, ArrowLeft } from "lucide-react"
import { chatService, type ChatMessage, type TypingUser } from "@/lib/chat-service"
import { useToast } from "@/hooks/use-toast"

interface ChatRoomProps {
  roomId: string
  userId: string
  userName: string
  onBack: () => void
}

const EMOJI_LIST = ["😀", "😂", "😍", "🔥", "👏", "💪", "⚡", "🎯", "🏆", "💯", "👍", "❤️"]

export default function ChatRoom({ roomId, userId, userName, onBack }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Subscribe to messages
    const unsubscribeMessages = chatService.subscribeToMessages(roomId, setMessages)

    // Subscribe to typing indicators
    const unsubscribeTyping = chatService.subscribeToTyping(roomId, (users) => {
      setTypingUsers(users.filter((user) => user.userId !== userId))
    })

    // Send welcome message
    chatService.sendSystemMessage(roomId, `${userName} joined the chat`)

    return () => {
      unsubscribeMessages()
      unsubscribeTyping()

      // Send leave message
      chatService.sendSystemMessage(roomId, `${userName} left the chat`)

      // Clear typing status
      if (isTyping) {
        chatService.setTyping(roomId, userId, userName, false)
      }
    }
  }, [roomId, userId, userName])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      await chatService.sendMessage(roomId, userId, userName, newMessage.trim())
      setNewMessage("")

      // Clear typing status
      if (isTyping) {
        setIsTyping(false)
        chatService.setTyping(roomId, userId, userName, false)
      }
    } catch (error) {
      toast({
        title: "Message Failed",
        description: "Could not send message",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (value: string) => {
    setNewMessage(value)

    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      chatService.setTyping(roomId, userId, userName, true)
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to clear typing status
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        chatService.setTyping(roomId, userId, userName, false)
      }
    }, 2000)
  }

  const handleEmojiClick = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.userId === userId
    const isSystemMessage = message.type === "system"

    if (isSystemMessage) {
      return (
        <div key={message.id} className="text-center my-4">
          <Badge variant="secondary" className="bg-white/10 text-white/70 text-sm">
            {message.text}
          </Badge>
        </div>
      )
    }

    return (
      <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4 min-w-0`}>
        <div
          className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] px-4 py-3 rounded-2xl break-words whitespace-pre-wrap leading-relaxed ${
            isOwnMessage
              ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
              : "bg-white/10 backdrop-blur-sm text-white border border-white/20"
          }`}
        >
          {!isOwnMessage && <div className="text-xs text-white/70 mb-1 font-medium truncate">{message.username}</div>}
          <div className="text-sm">
            {message.text.split(/(@\w+)/).map((part, index) => {
              if (part.startsWith("@")) {
                return (
                  <span key={index} className="text-yellow-300 font-bold break-words">
                    {part}
                  </span>
                )
              }
              return (
                <span key={index} className="break-words">
                  {part}
                </span>
              )
            })}
          </div>
          <div className={`text-[11px] mt-1 ${isOwnMessage ? "text-white/70" : "text-white/50"}`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-[320px] h-[320px] rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-[360px] h-[360px] rounded-full bg-amber-500/15 blur-3xl" />
      </div>

      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-6 h-6 text-blue-300" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-amber-300 bg-clip-text text-transparent">
                Chat Room
              </h1>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/10 text-white/80 border-white/20 px-3 py-1.5">
            {messages.filter((m) => m.type !== "system").length} messages
          </Badge>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-112px)]">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl h-full flex flex-col overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500/20 to-orange-500/20 rounded-t-lg flex-shrink-0">
            <CardTitle className="text-white text-xl font-bold">Live Chat • Room {roomId.slice(-6)}</CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 min-w-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 min-w-0">
              <div className="space-y-2 min-w-0">
                {messages.length === 0 ? (
                  <div className="text-center text-white/60 py-16">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl mb-2">No messages yet</p>
                    <p className="text-lg">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map(renderMessage)
                )}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-white/10 backdrop-blur-sm text-white/70 px-4 py-2 rounded-2xl border border-white/20 text-sm">
                      {typingUsers.map((user) => user.username).join(", ")}
                      {typingUsers.length === 1 ? " is" : " are"} typing...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm flex-shrink-0">
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="mb-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="grid grid-cols-6 gap-2">
                    {EMOJI_LIST.map((emoji, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-2xl hover:bg-white/10 transition-all duration-300 hover:scale-110"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-white hover:bg-white/10"
                >
                  <Smile className="w-5 h-5" />
                </Button>

                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message... Use @username to mention someone"
                    className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400 focus:ring-purple-400/50 pr-12 py-3 text-lg rounded-xl backdrop-blur-sm break-words"
                  />
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-blue-600 to-amber-500 hover:from-blue-700 hover:to-amber-600 text-white px-5 py-2.5 rounded-xl"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
