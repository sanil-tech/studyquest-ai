import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Key, Lock, AlertCircle, Loader2, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";

export default function ChildLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loginMethod, setLoginMethod] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const cleanUsername = username.trim();

      if (!cleanUsername) {
        setError("Please enter your Username");
        setLoading(false);
        return;
      }

      if (loginMethod === "password" && !password) {
        setError("Please enter your password");
        setLoading(false);
        return;
      }

      if (loginMethod === "pin" && (!pin || pin.length < 4)) {
        setError("Please enter your 4-6 digit PIN");
        setLoading(false);
        return;
      }

      const response = await base44.functions.invoke("childLogin", {
        username: cleanUsername,
        password: loginMethod === "password" ? password : null,
        pin: loginMethod === "pin" ? pin : null,
      });

      if (response.data.success) {
        const userData = response.data.user;

        localStorage.setItem('studyquest_session', JSON.stringify({
          type: 'child',
          token: userData.session_token,
          loginTime: new Date().toISOString()
        }));
        localStorage.setItem('studyquest_user', JSON.stringify(userData));

        toast({
          title: "Welcome back! 🎉",
          description: `Hi ${userData.nickname || "Hero"}!`,
          duration: 2000
        });

        if (userData.profile_completed) {
          navigate("/dashboard");
        } else {
          navigate("/complete-profile");
        }
      } else {
        setError(response.data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Child login error:", err);
      setError(err.response?.data?.error || "Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="w-full border-2 border-primary/20 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              Welcome to StudyQuest! 🚀
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Login with your Username
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <Button
                variant={loginMethod === "password" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setLoginMethod("password");
                  setPin("");
                  setError("");
                }}
                className={loginMethod === "password" ? "shadow-sm bg-white text-slate-900" : "text-slate-600"}
              >
                <Key className="w-4 h-4 mr-2" />
                Password
              </Button>
              <Button
                variant={loginMethod === "pin" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setLoginMethod("pin");
                  setPassword("");
                  setError("");
                }}
                className={loginMethod === "pin" ? "shadow-sm bg-white text-slate-900" : "text-slate-600"}
              >
                <Lock className="w-4 h-4 mr-2" />
                PIN
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                onKeyPress={handleKeyPress}
                placeholder="e.g. testing"
                className="text-lg h-12 bg-white"
                autoFocus
              />
            </div>

            {loginMethod === "password" ? (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  className="text-lg h-12 bg-white"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-semibold">
                  PIN (4-6 digits)
                </Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyPress={handleKeyPress}
                  placeholder="••••"
                  className="text-lg h-12 font-mono tracking-widest text-center bg-white"
                  maxLength={6}
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="border-red-300 bg-red-50 text-red-900">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <AlertDescription className="text-sm font-medium ml-2 break-words">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 text-lg font-bold rounded-xl mt-2 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login 🎯"
              )}
            </Button>

            <div className="pt-4 pb-2 border-t mt-6">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Main Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}