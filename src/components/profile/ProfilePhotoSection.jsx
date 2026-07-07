import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon } from "lucide-react";
import AvatarSelector from "@/components/student/AvatarSelector";

export default function ProfilePhotoSection({ user, avatarMode, setAvatarMode, uploading, fileInputRef, handlePhotoUpload, handleSaveAvatar }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-heading font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Profile Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={avatarMode === "emoji" ? "default" : "outline"}
              size="sm"
              onClick={() => setAvatarMode("emoji")}
              className="flex-1"
            >
              😊 Emoji Avatar
            </Button>
            <Button
              variant={avatarMode === "photo" ? "default" : "outline"}
              size="sm"
              onClick={() => setAvatarMode("photo")}
              className="flex-1"
            >
              📷 My Photo
            </Button>
          </div>

          {avatarMode === "photo" && (
            <div className="text-center py-4">
              {user?.profile_picture_url ? (
                <div className="mb-4">
                  <img
                    src={user.profile_picture_url}
                    alt="Your photo"
                    className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Current photo</p>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {user?.profile_picture_url ? "Change Photo" : "Upload Photo"}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">Optional - choose a photo or use emoji avatar</p>
            </div>
          )}

          {avatarMode === "emoji" && (
            <AvatarSelector currentAvatar={user?.avatar_emoji} onSelect={handleSaveAvatar} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}