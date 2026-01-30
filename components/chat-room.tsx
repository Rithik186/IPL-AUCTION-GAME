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

interface GiphyGif {
  id: string
  images: {
    fixed_height: {
      url: string
    }
  }
}

const EMOJI_LIST = ["😀", "😂", "😍", "🔥", "👏", "💪", "⚡", "🎯", "🏆", "💯", "👍", "❤️"]

export default function ChatRoom({ roomId, userId, userName, onBack }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [gifSearchTerm, setGifSearchTerm] = useState("cricket")
  const [gifs, setGifs] = useState<GiphyGif[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const emojiSpamIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Subscribe to messages
    const unsubscribeMessages = chatService.subscribeToMessages(roomId, setMessages)

    // Subscribe to typing indicators
    const unsubscribeTyping = chatService.subscribeToTyping(roomId, (users: TypingUser[]) => {
      setTypingUsers(users.filter((user: TypingUser) => user.userId !== userId))
    })

    return () => {
      unsubscribeMessages()
      unsubscribeTyping()

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
  }

  const handleEmojiMouseDown = (emoji: string) => {
    handleEmojiClick(emoji)
    emojiSpamIntervalRef.current = setInterval(() => {
      handleEmojiClick(emoji)
    }, 150)
  }

  const handleEmojiMouseUp = () => {
    if (emojiSpamIntervalRef.current) {
      clearInterval(emojiSpamIntervalRef.current)
    }
  }

  const fetchGifs = async () => {
    const GIPHY_API_KEY = "YOUR_GIPHY_API_KEY" // Replace with your actual API key
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${gifSearchTerm}&limit=12`

    try {
      const response = await fetch(url)
      const data = await response.json()
      setGifs(data.data)
    } catch (error) {
      // Mock data
      setGifs([
        {
          id: "1",
          images: { fixed_height: { url: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyE/giphy.gif" } },
        },
        {
          id: "2",
          images: { fixed_height: { url: "https://media.giphy.com/media/l0HlP2ms0eS9ebQ6Q/giphy.gif" } },
        },
        {
          id: "3",
          images: { fixed_height: { url: "https://media.giphy.com/media/3o6ZtpxSZbQRR7d01q/giphy.gif" } },
        },
        {
          id: "4",
          images: { fixed_height: { url: "https://media.giphy.com/media/l3q2yGSqE2iylkYwM/giphy.gif" } },
        },
      ])
    }
  }

  useEffect(() => {
    if (showGifPicker) {
      fetchGifs()
    }
  }, [showGifPicker, gifSearchTerm])

  const handleGifClick = (gifUrl: string) => {
    chatService.sendMessage(roomId, userId, userName, `!gif[${gifUrl}]`)
    setShowGifPicker(false)
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.userId === userId

    // Skip system messages about joining/leaving
    if (message.type === "system") {
      return null
    }

    return (
      <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-3 min-w-0 group`}>
        {!isOwnMessage && (
          <div className="flex-shrink-0 mr-2 flex items-end">
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white uppercase border border-white/20">
                {message.username.substring(0, 1)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-black shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
            </div>
          </div>
        )}
        <div
          className={`relative max-w-[85%] px-3 py-2 rounded-2xl break-words text-sm ${isOwnMessage
            ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
            : "bg-[#1E2030] text-gray-100 border border-white/10 shadow-lg"
            }`}
        >
          {!isOwnMessage && <div className="text-[10px] text-cyan-400 mb-0.5 font-bold tracking-wide uppercase opacity-80">{message.username}</div>}
          <div className="leading-snug">
            {message.text.startsWith("!gif[") && message.text.endsWith("]") ? (
              <img
                src={message.text.substring(5, message.text.length - 1)}
                alt="gif"
                className="mt-1 rounded-lg max-w-full h-auto border border-white/10"
              />
            ) : (
              message.text.split(/(@\w+)/).map((part: string, index: number) => {
                if (part.startsWith("@")) {
                  return (
                    <span key={index} className="text-yellow-400 font-bold bg-yellow-400/10 rounded px-1">
                      {part}
                    </span>
                  )
                }
                return (
                  <span key={index}>
                    {part}
                  </span>
                )
              })
            )}
          </div>
          <div className={`text-[9px] mt-1 text-right ${isOwnMessage ? "text-white/60" : "text-white/40"}`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#0F111A] border-l border-white/10 relative overflow-hidden">

      {/* Header */}
      <div className="bg-[#151725] border-b border-white/10 p-3 flex items-center justify-between shadow-xl z-10">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg">
            <MessageCircle className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-sm font-bold text-white tracking-wide">Live Chat</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-transparent text-emerald-400 border-emerald-500/30 text-[10px] px-2 py-0.5 h-5 flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            LIVE
          </Badge>
          <Button variant="ghost" size="icon" onClick={onBack} className="h-6 w-6 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-3 overflow-y-auto custom-scrollbar">
        <div className="space-y-1 min-w-0 pb-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-white/30 space-y-2 mt-10">
              <MessageCircle className="w-10 h-10 opacity-20" />
              <p className="text-xs">No messages yet.</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold">Be the first to say hi!</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-2 mt-2 ml-1">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
              </div>
              <span className="text-[10px] text-white/40 italic">
                {typingUsers.length > 2 ? "Several people are typing..." : `${typingUsers.map(u => u.username).join(", ")} is typing...`}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 bg-[#151725] border-t border-white/10 z-10">
        {/* Emoji/GIF Pickers Container - Positioning absolute to pop up */}
        <div className="relative">
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 w-full bg-[#1E2030] border border-white/10 rounded-xl shadow-2xl p-2 z-50">
              <div className="grid grid-cols-6 gap-1">
                {EMOJI_LIST.map((emoji, index) => (
                  <button
                    key={index}
                    onMouseDown={() => handleEmojiMouseDown(emoji)}
                    onMouseUp={handleEmojiMouseUp}
                    onMouseLeave={handleEmojiMouseUp}
                    className="p-1.5 hover:bg-white/10 rounded text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showGifPicker && (
            <div className="absolute bottom-12 left-0 w-full bg-[#1E2030] border border-white/10 rounded-xl shadow-2xl p-2 z-50 h-56 flex flex-col">
              <Input
                value={gifSearchTerm}
                onChange={(e) => setGifSearchTerm(e.target.value)}
                placeholder="Search GIFs..."
                className="h-8 bg-black/40 border-white/10 text-white text-xs mb-2 focus:ring-1 focus:ring-indigo-500"
              />
              <div className="grid grid-cols-3 gap-1 overflow-y-auto flex-1 no-scrollbar">
                {gifs.map((gif: any) => (
                  <img
                    key={gif.id}
                    src={gif.images.fixed_height.url}
                    alt="gif"
                    onClick={() => handleGifClick(gif.images.fixed_height.url)}
                    className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 bg-black/30 rounded-xl border border-white/10 flex items-center p-1 focus-within:border-indigo-500/50 transition-colors">
            <button
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
              className={`p-2 rounded-lg text-white/50 hover:text-indigo-400 hover:bg-white/5 transition-colors ${showEmojiPicker ? "text-indigo-400 bg-white/5" : ""}`}
            >
              <Smile className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
              className={`p-2 rounded-lg text-white/50 hover:text-pink-400 hover:bg-white/5 transition-colors ${showGifPicker ? "text-pink-400 bg-white/5" : ""}`}
            >
              <div className="text-[9px] font-black border border-current rounded px-0.5 leading-none">GIF</div>
            </button>
            <Input
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type..."
              className="flex-1 border-0 bg-transparent h-9 text-sm text-white focus-visible:ring-0 placeholder:text-white/30 px-2"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 shrink-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
