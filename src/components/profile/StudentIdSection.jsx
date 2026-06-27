import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IdCard, Copy, RefreshCw, QrCode, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { QRCodeSVG } from "qrcode.react";

export default function StudentIdSection({ user }) {
  const { toast } = useToast();
  const [studentId, setStudentId] = useState(null);
  const [linkCode, setLinkCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      // Get or generate Student ID
      if (user.student_id) {
        setStudentId(user.student_id);
      } else {
        // Generate Student ID
        const result = await base44.functions.invoke('generateStudentId', {});
        setStudentId(result.student_id);
      }

      // Get active link code
      const codes = await base44.entities.ParentLinkCode.filter({
        child_id: user.id,
        is_active: true
      });

      if (codes.length > 0) {
        const now = new Date();
        const expiresAt = new Date(codes[0].expires_at);
        if (now < expiresAt) {
          setLinkCode({
            code: codes[0].code,
            expires_at: codes[0].expires_at
          });
        }
      }
    } catch (err) {
      console.error("Failed to load student ID/link code:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLinkCode = async () => {
    setGenerating(true);
    try {
      const result = await base44.functions.invoke('generateParentLinkCode', {});
      setLinkCode({
        code: result.code,
        expires_at: result.expires_at
      });
      toast({
        title: "Link Code Generated!",
        description: "Share this code with your parent. Valid for 24 hours.",
      });
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'id') {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
      toast({
        title: "Copied!",
        description: `${type === 'id' ? 'Student ID' : 'Link Code'} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isExpired = linkCode && new Date() > new Date(linkCode.expires_at);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <IdCard className="w-5 h-5 text-primary" />
          Student Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Student ID */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">StudyQuest Student ID</label>
            <Badge variant="secondary" className="text-xs">Permanent</Badge>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted/50 rounded-lg px-4 py-3 font-mono text-lg font-bold text-center border-2 border-primary/20">
              {studentId || "Not generated"}
            </div>
            {studentId && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(studentId, 'id')}
              >
                {copiedId ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Share this ID with your parents to link accounts
          </p>
        </div>

        {/* Parent Link Code */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Parent Link Code</label>
            {linkCode && !isExpired && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                24hr Valid
              </Badge>
            )}
          </div>
          
          {linkCode && !isExpired ? (
            <div className="flex gap-2">
              <div className="flex-1 bg-primary/5 rounded-lg px-4 py-3 font-mono text-lg font-bold text-center border-2 border-primary/30">
                {linkCode.code}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(linkCode.code, 'code')}
              >
                {copiedCode ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowQR(!showQR)}
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleGenerateLinkCode}
              disabled={generating}
              className="w-full"
              variant="outline"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Link Code
                </>
              )}
            </Button>
          )}

          {linkCode && !isExpired && (
            <p className="text-xs text-muted-foreground">
              Expires: {new Date(linkCode.expires_at).toLocaleString('en-MY', { 
                day: 'numeric', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          )}

          {isExpired && (
            <p className="text-xs text-destructive">
              This link code has expired. Generate a new one.
            </p>
          )}
        </div>

        {/* QR Code Display */}
        {showQR && linkCode && !isExpired && studentId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-xl border-2 border-primary/20 flex flex-col items-center"
          >
            <QRCodeSVG
              value={JSON.stringify({
                student_id: studentId,
                link_code: linkCode.code
              })}
              size={200}
              level="H"
              includeMargin={true}
            />
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Scan this QR code to link parent account
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}