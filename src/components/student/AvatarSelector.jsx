import React, { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const AVATARS = [
  "🎓", "👨‍🎓", "👩‍🎓", "🧑‍🎓", "👨‍🏫", "👩‍🏫", "🧑‍🏫",
  "🦸", "🦸‍♂️", "🦸‍♀️", "🦹", "🦹‍♂️", "🦹‍♀️",
  "😎", "🤩", "🥳", "🤓", "🧠", "⭐",
  "🚀", "🎮", "⚽", "🎨", "🎵", "📚", "🔬",
];

export default function AvatarSelector({ currentAvatar, onSelect }) {
  const [selected, setSelected] = useState(currentAvatar || "🎓");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSelect?.(selected);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-heading font-bold text-foreground">Choose Your Avatar</h3>
      </div>

      {/* Preview */}
      <div className="text-center mb-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-2 shadow-lg">
          <span className="text-5xl">{selected}</span>
        </div>
        <p className="text-xs text-muted-foreground">Your avatar will appear on your profile</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {AVATARS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => setSelected(emoji)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
              selected === emoji
                ? "bg-primary text-white shadow-md scale-110"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Save button */}
      <Button
        onClick={handleSave}
        className="w-full rounded-xl bg-gradient-to-r from-primary to-indigo-600"
      >
        {saved ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Saved!
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Save Avatar
          </>
        )}
      </Button>
    </div>
  );
}