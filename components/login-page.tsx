"use client"

import type React from "react"
import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Mail, Lock, User, Apple, Loader2, Eye, EyeOff, Shield } from "lucide-react"
import { auth } from "@/lib/firebase"
import Prism from "@/components/Prism" // Added Prism import

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  updateProfile,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth"
import { useToast } from "@/hooks/use-toast"

interface LoginPageProps {
  onLogin: (userData: any) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [loginData, setLoginData] = useState({ email: "", password: "", show: false })
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "", confirmPassword: "", show: false })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const rotating = ["Real-time bidding", "Modern chat", "Mobile-first design", "Premium UI"]
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % rotating.length), 2200)
    return () => clearInterval(t)
  }, [])

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePassword = (password: string) => password.length >= 6

  const passwordScore = useMemo(() => {
    const p = signupData.password
    let s = 0
    if (p.length >= 6) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }, [signupData.password])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!validateEmail(loginData.email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address", variant: "destructive" })
      return
    }
    if (!validatePassword(loginData.password)) {
      toast({ title: "Invalid Password", description: "Minimum 6 characters", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      await setPersistence(auth, browserSessionPersistence)
      const { user } = await signInWithEmailAndPassword(auth, loginData.email, loginData.password)
      if (!user.emailVerified) {
        toast({ title: "Email Not Verified", description: "Please verify your email", variant: "destructive" })
        setLoading(false)
        return
      }
      toast({ title: "Welcome back!", description: "Signed in successfully" })
      onLogin({ id: user.uid, name: user.displayName || "Player", email: user.email, avatar: user.photoURL })
    } catch (e: any) {
      toast({ title: "Login Failed", description: e.message, variant: "destructive" })
    }
    setLoading(false)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!validateEmail(signupData.email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address", variant: "destructive" })
      return
    }
    if (!validatePassword(signupData.password)) {
      toast({ title: "Invalid Password", description: "Minimum 6 characters", variant: "destructive" })
      return
    }
    if (signupData.password !== signupData.confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match", variant: "destructive" })
      return
    }
    if (signupData.name.trim().length < 2) {
      toast({ title: "Invalid Name", description: "Name must be at least 2 characters", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password)
      await updateProfile(user, { displayName: signupData.name })
      await sendEmailVerification(user)
      toast({ title: "Account Created", description: "Verify your email to continue" })
      setSignupData({ name: "", email: "", password: "", confirmPassword: "", show: false })
    } catch (e: any) {
      toast({ title: "Signup Failed", description: e.message, variant: "destructive" })
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setLoading(true)
    try {
      await setPersistence(auth, browserSessionPersistence)
      const provider = new GoogleAuthProvider()
      const { user } = await signInWithPopup(auth, provider)
      toast({ title: "Login Successful", description: "Welcome!" })
      onLogin({ id: user.uid, name: user.displayName || "Player", email: user.email, avatar: user.photoURL })
    } catch (e: any) {
      toast({ title: "Google Login Failed", description: e.message, variant: "destructive" })
    }
    setLoading(false)
  }

  function handleAppleLogin() {
    toast({ title: "Coming Soon", description: "Apple Sign-In will be available soon!" })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white relative overflow-hidden p-4">
      {/* New Prism background */}
      <div className="absolute inset-0 -z-10">
        <Prism
            animationType="rotate"
            timeScale={0.5}
            scale={3.6}
            height={3.5}
            baseWidth={5.5}
            noise={0}
            glow={0.3}
            hueShift={-0.44}
            colorFrequency={0.5}
        />
      </div>


      <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* hero */}
        <div className="hidden lg:block text-center lg:text-left">
          <h1 className="text-pretty text-5xl xl:text-7xl font-black tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-blue-300 to-amber-300 bg-clip-text text-transparent drop-shadow-lg">
              Sign in. Squad up. Bid big.
            </span>
          </h1>
          <p className="mt-4 text-blue-100/90 max-w-prose mx-auto lg:mx-0 text-lg animate-fade-in-up transition-all duration-500">
            {rotating[idx]}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center transform hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl">
              <div className="text-2xl font-bold text-blue-300">10+</div>
              <div className="text-white/70 text-sm">Teams</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center transform hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl">
              <div className="text-2xl font-bold text-amber-300">₹120Cr</div>
              <div className="text-white/70 text-sm">Budget</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center transform hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl">
              <div className="text-2xl font-bold text-emerald-300">Live</div>
              <div className="text-white/70 text-sm">Leaderboard</div>
            </div>
          </div>
        </div>

        {/* auth */}
        <Card className="w-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl rounded-3xl p-6 md:p-8 transform hover:scale-[1.01] transition-transform duration-300">
          <CardContent className="p-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20 rounded-full p-1 mb-6 shadow-inner">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md rounded-full transition-all duration-300 text-white/70 hover:text-white"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md rounded-full transition-all duration-300 text-white/70 hover:text-white"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="pt-4 space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-10 bg-white/15 border-white/25 text-white placeholder:text-white/60"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                      <Input
                        id="password"
                        type={loginData.show ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-10 pr-10 bg-white/15 border-white/25 text-white placeholder:text-white/60"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        aria-label="Toggle password visibility"
                        className="absolute right-3 top-2.5 text-white/70 hover:text-white"
                        onClick={() => setLoginData((p) => ({ ...p, show: !p.show }))}
                      >
                        {loginData.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="pt-4 space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        className="pl-10 bg-white/15 border-white/25 text-white placeholder:text-white/60"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="pl-10 bg-white/15 border-white/25 text-white placeholder:text-white/60"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                      <Input
                        id="signup-password"
                        type={signupData.show ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="pl-10 pr-10 bg-white/15 border-white/25 text-white placeholder:text-white/60"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        aria-label="Toggle password visibility"
                        className="absolute right-3 top-2.5 text-white/70 hover:text-white"
                        onClick={() => setSignupData((p) => ({ ...p, show: !p.show }))}
                      >
                        {signupData.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="mt-1">
                      <div className="flex items-center justify-between text-xs text-white/70">
                        <span className="flex items-center">
                          <Shield className="h-3 w-3 mr-1" />
                          Strength
                        </span>
                        <span>{["Weak", "Fair", "Good", "Strong"][Math.max(0, passwordScore - 1)] || "Weak"}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-1">
                        <div
                          className={`h-full transition-all ${
                            passwordScore <= 1
                              ? "bg-red-500 w-1/4"
                              : passwordScore === 2
                                ? "bg-yellow-500 w-2/4"
                                : passwordScore === 3
                                  ? "bg-blue-500 w-3/4"
                                  : "bg-emerald-500 w-full"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                      <Input
                        id="confirm-password"
                        type={signupData.show ? "text" : "password"}
                        placeholder="Confirm password"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        className="pl-10 pr-10 bg-white/15 border-white/25 text-white placeholder:text-white/60"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 text-white/60 bg-transparent">Or continue with</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAppleLogin}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                  disabled={loading}
                >
                  <Apple className="h-4 w-4 mr-2" />
                  Apple
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}