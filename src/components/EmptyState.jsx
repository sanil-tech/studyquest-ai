import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

/**
 * EmptyState Component
 * Displays friendly empty state with illustration, title, and CTA
 * 
 * @param {Object} props
 * @param {string} props.emoji - Emoji or illustration
 * @param {string} props.title - Empty state title
 * @param {string} props.description - Empty state description
 * @param {Object} props.action - Action button object { label, onClick }
 * @param {string} props.variant - Variant: 'default', 'compact' (default: 'default')
 */
export default function EmptyState({
  emoji = '🌳',
  title = 'Tiada Data',
  description = 'Belum ada item untuk dipaparkan di sini.',
  action = null,
  variant = 'default',
}) {
  const isCompact = variant === 'compact';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center text-center ${
        isCompact ? 'py-8' : 'py-16'
      }`}
    >
      {/* Emoji/Icon */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className={isCompact ? 'text-4xl mb-3' : 'text-6xl mb-6'}
      >
        {emoji}
      </motion.div>

      {/* Title */}
      <h3 className={`font-black text-stone-800 mb-2 ${isCompact ? 'text-base' : 'text-xl'}`}>
        {title}
      </h3>

      {/* Description */}
      <p className={`text-stone-500 font-medium mb-6 ${isCompact ? 'text-xs max-w-xs' : 'text-sm max-w-md'}`}>
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <Button
          onClick={action.onClick}
          className={`bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl ${
            isCompact ? 'text-xs px-4 py-2' : 'text-sm px-6 py-2'
          }`}
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
