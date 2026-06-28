import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { GraduationCap, Key, Lock, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";

export default function ChildLogin() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loginMethod, setLoginMethod] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      if (!studentId.trim()) {
        setError("Please enter your Student ID");
        setLoading(false);
        return;
      }

      if (loginMethod === "password" && !password.trim()) {
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
        student_id: studentId.trim().toUpperCase(),
        password: loginMethod === "password" ? password.trim() : null,
        pin: loginMethod === "pin" ? pin.trim() : null,
      });

      if (response.data.success) {
        const userData = response.data.user;
        localStorage.setItem('studyquest_session', JSON.stringify({
          type: 'child',
          userId: userData.id,
          loginTime: new Date().toISOString()
        }));
        localStorage.setItem('studyquest_user', JSON.stringify(userData));

        toast({
          title: "Welcome back! 🎉",
          description: `Hi ${userData.nickname || userData.name || "Student"}!`,
          duration: 2000,
        });

        if (userData.profile_completed) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/complete-profile";
        }
      } else {
        setError(response.data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Child login error:", err);
      setError(err.response?.data?.error || "Incorrect details, please try again.");
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
      >
        <Card className="w-full max-w-md border-2 border-primary/20 shadow-xl">
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
              Login with your Student ID
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
              <Button
                variant={loginMethod === "password" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setLoginMethod("password");
                  setPin("");
                  setError("");
                }}
                className={loginMethod === "password" ? "shadow" : ""}
              >
                <Key className="w-4 h-4 mr-1" />
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
                className={loginMethod === "pin" ? "shadow" : ""}
              >
                <Lock className="w-4 h-4 mr-1" />
                PIN
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentId" className="text-base font-semibold">
                Student ID
              </Label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="SQ-ABC123"
                className="text-lg h-12 font-mono tracking-wide"
                maxLength={9}
                autoFocus
              />
            </div>

            {loginMethod === "password" ? (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-semibold">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  className="text-lg h-12"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-base font-semibold">
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
                  className="text-lg h-12 font-mono tracking-widest"
                  maxLength={6}
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-14 text-lg font-bold rounded-xl mt-4"
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

            <div className="pt-2">
              <a
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Main Login
              </a>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Forgot your credentials? Ask your parent to help! 👨‍👩‍👧
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}