import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { X, IdCard, KeyRound, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

export default function LinkChildModal({ onClose, onLinked }) {
  const { toast } = useToast();

  const [selectedMethod, setSelectedMethod] = useState("student_id");

  const [studentId, setStudentId] = useState("");
  const [linkCode, setLinkCode] = useState("");
  const [childEmail, setChildEmail] = useState("");

  const [linking, setLinking] = useState(false);

  // =========================
  // LINK BY STUDENT ID
  // =========================
  const handleLinkByStudentId = async () => {
    if (!studentId.trim()) {
      return toast({
        title: "Student ID required",
        description: "Please enter your child's Student ID",
        variant: "destructive",
      });
    }

    setLinking(true);

    try {
      const result = await base44.functions.invoke("linkParentToChild", {
        method: "student_id",
        student_id: studentId.trim().toUpperCase(),
      });

      toast({
        title: "Request Sent!",
        description: `${result?.child?.name || "Child"} needs to approve connection.`,
      });

      onLinked?.();
    } catch (err) {
      toast({
        title: "Link Failed",
        description: err.message || "Invalid Student ID",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  // =========================
  // LINK BY CODE
  // =========================
  const handleLinkByCode = async () => {
    if (!linkCode.trim()) {
      return toast({
        title: "Link Code required",
        description: "Please enter the 8-character code",
        variant: "destructive",
      });
    }

    setLinking(true);

    try {
      const result = await base44.functions.invoke("linkParentToChild", {
        method: "link_code",
        link_code: linkCode.trim().toUpperCase(),
      });

      toast({
        title: "Successfully Linked!",
        description: `Connected to ${result?.child?.name || "child"}`,
      });

      onLinked?.();
    } catch (err) {
      toast({
        title: "Link Failed",
        description: err.message || "Code invalid or expired",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  // =========================
  // LINK BY EMAIL
  // =========================
  const handleLinkByEmail = async () => {
    if (!childEmail.trim()) {
      return toast({
        title: "Email required",
        description: "Please enter child's email",
        variant: "destructive",
      });
    }

    setLinking(true);

    try {
      const me = await base44.auth.me();

      await base44.entities.LinkRequest.create({
        student_email: childEmail.trim(),
        parent_email: me?.email,
        initiated_by: "parent",
        status: "pending",
      });

      toast({
        title: "Request Sent!",
        description: "Waiting for child approval",
      });

      onLinked?.();
    } catch (err) {
      toast({
        title: "Request Failed",
        description: err.message || "Try again",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add Child</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS */}
        <Tabs
          value={selectedMethod}
          onValueChange={setSelectedMethod}
          defaultValue="student_id"
        >
          <TabsList className="grid grid-cols-3 w-full mb-6">
            <TabsTrigger value="student_id">
              <IdCard className="w-4 h-4 mr-1" />
              ID
            </TabsTrigger>

            <TabsTrigger value="link_code">
              <KeyRound className="w-4 h-4 mr-1" />
              Code
            </TabsTrigger>

            <TabsTrigger value="email">
              <Mail className="w-4 h-4 mr-1" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* =========================
              STUDENT ID TAB
          ========================= */}
          <TabsContent value="student_id" className="space-y-4">
            <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded">
              Enter your child’s Student ID (example: SQ-7XK92A)
            </div>

            <div className="space-y-2">
              <Label>Student ID</Label>
              <Input
                value={studentId}
                onChange={(e) =>
                  setStudentId(e.target.value.toUpperCase())
                }
                placeholder="SQ-XXXXXX"
                className="font-mono uppercase"
              />
            </div>

            <Button
              onClick={handleLinkByStudentId}
              disabled={linking}
              className="w-full"
            >
              {linking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </TabsContent>

          {/* =========================
              LINK CODE TAB
          ========================= */}
          <TabsContent value="link_code" className="space-y-4">
            <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded">
              Enter 8-character code from child
            </div>

            <div className="space-y-2">
              <Label>Link Code</Label>
              <Input
                value={linkCode}
                onChange={(e) =>
                  setLinkCode(e.target.value.toUpperCase())
                }
                maxLength={8}
                placeholder="ABCDEFGH"
                className="font-mono uppercase"
              />
            </div>

            <Button
              onClick={handleLinkByCode}
              disabled={linking}
              className="w-full"
            >
              {linking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : (
                "Link Child"
              )}
            </Button>
          </TabsContent>

          {/* =========================
              EMAIL TAB
          ========================= */}
          <TabsContent value="email" className="space-y-4">
            <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded">
              Send request to child email
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={childEmail}
                onChange={(e) => setChildEmail(e.target.value)}
                placeholder="child@email.com"
              />
            </div>

            <Button
              onClick={handleLinkByEmail}
              disabled={linking}
              className="w-full"
            >
              {linking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* FOOTER */}
        <div className="mt-6 text-xs text-center text-gray-400">
          Ask your child to share their Student ID or Link Code
        </div>
      </motion.div>
    </div>
  );
}