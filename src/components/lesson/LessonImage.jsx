import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LessonImage({ prompt, alt, caption }) {
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!prompt || imageUrl) return;
    
    const loadImage = async () => {
      setImageLoading(true);
      setError(null);
      try {
        // Try to generate image from prompt using Core integration
        const result = await base44.integrations.Core.GenerateImage({ prompt });
        if (result?.url) {
          setImageUrl(result.url);
        } else {
          setError("Image generation unavailable");
        }
      } catch (err) {
        console.log("Image generation skipped:", err.message);
        setError("Could not load image");
      } finally {
        setImageLoading(false);
      }
    };

    loadImage();
  }, [prompt, imageUrl]);

  if (!prompt) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-6"
    >
      <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/30">
        {imageLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-xs text-muted-foreground">Generating illustration...</p>
            </div>
          </div>
        ) : imageUrl ? (
          <div className="relative">
            <img
              src={imageUrl}
              alt={alt || "Lesson illustration"}
              className="w-full h-auto max-h-64 object-cover"
            />
            {caption && (
              <div className="bg-background/90 backdrop-blur-sm px-3 py-2 text-xs text-muted-foreground border-t border-border/50">
                {caption}
              </div>
            )}
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <div className="text-center p-4">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">{alt || caption || "Educational illustration"}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}