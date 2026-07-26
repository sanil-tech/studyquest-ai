// src/lib/rewardSystem.js
import { base44 } from "@/api/base44Client";

/**
 * Mendapatkan ID Pelajar Aktif (Menyokong Log Masuk Pelajar & Mod Anak Ibu Bapa)
 */
export const getActiveStudentId = async () => {
  try {
    const currentUser = await base44.auth.me();
    if (!currentUser) return null;

    if (currentUser.app_role === "parent") {
      const activeChildId = 
        localStorage.getItem("active_child_session") || 
        localStorage.getItem("selected_child_id") || 
        localStorage.getItem("active_student_id");

      if (activeChildId) return activeChildId;

      // Cubaan mengambil dari fail cache active_child
      const cachedStr = localStorage.getItem("active_child");
      if (cachedStr) {
        try {
          const parsed = JSON.parse(cachedStr);
          if (parsed?.id) return parsed.id;
        } catch {}
      }
    }

    return currentUser.id;
  } catch (err) {
    console.error("Gagal mendapatkan ID Pelajar:", err);
    return null;
  }
};

/**
 * Anugerah Daun Emas (Coins) & XP kepada akaun anak secara fail-safe
 */
export const awardCoinsAndXP = async (studentId, { coins = 0, xp = 0, reason = "Misi Diselesaikan", referenceId = null }) => {
  if (!studentId) return false;

  try {
    // 1. KEMAS KINI / CIPTA WALLET ANAK
    if (coins > 0) {
      try {
        const wallets = await base44.entities.Wallet.filter({ student_id: studentId });
        const targetWallet = Array.isArray(wallets) ? wallets[0] : wallets;

        if (targetWallet?.id) {
          const newBalance = (targetWallet.balance || 0) + coins;
          await base44.entities.Wallet.update(targetWallet.id, { balance: newBalance });
        } else {
          await base44.entities.Wallet.create({ student_id: studentId, balance: coins });
        }

        // Merekodkan transaksi kewangan
        await base44.entities.Transaction.create({
          student_id: studentId,
          type: "earn",
          amount: coins,
          reason: reason,
          reference_id: referenceId
        });
      } catch (walletErr) {
        console.error("Ralat mengemaskini Wallet anak:", walletErr);
      }
    }

    // 2. KEMAS KINI / CIPTA PROGRESS XP & LEVEL ANAK
    if (xp > 0) {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const progresses = await base44.entities.Progress.filter({ student_id: studentId });
        const targetProgress = Array.isArray(progresses) ? progresses[0] : progresses;

        if (targetProgress?.id) {
          const currentXp = targetProgress.total_xp || 0;
          const newXp = currentXp + xp;
          const newLevel = Math.floor(newXp / 200) + 1;

          await base44.entities.Progress.update(targetProgress.id, {
            total_xp: newXp,
            level: newLevel,
            last_study_date: todayStr
          });
        } else {
          await base44.entities.Progress.create({
            student_id: studentId,
            total_xp: xp,
            level: Math.floor(xp / 200) + 1,
            streak_days: 1,
            last_study_date: todayStr
          });
        }
      } catch (progErr) {
        console.error("Ralat mengemaskini Progress anak:", progErr);
      }
    }

    return true;
  } catch (err) {
    console.error("Gagal mengemaskini ganjaran anak:", err);
    return false;
  }
};
