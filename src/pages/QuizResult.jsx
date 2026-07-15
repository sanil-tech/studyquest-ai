{/* Rewards earned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-amber-50 rounded-2xl p-4 text-center border border-amber-100">
          <Coins className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-700">+{attempt?.coins_earned || 0}</p>
          <p className="text-xs text-amber-500">Coins Earned</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 text-center border border-purple-100">
          <Zap className="w-6 h-6 text-purple-500 mx-auto mb-1" />
          {/* ✅ Jangan guna Math.round(score/2). Baca terus dari backend */}
          <p className="text-2xl font-bold text-purple-700">+{attempt?.xp_earned || 0}</p>
          <p className="text-xs text-purple-500">XP Earned</p>
        </div>
      </motion.div>
