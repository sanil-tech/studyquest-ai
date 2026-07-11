const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setSaving(true);
    try {
      const updateData = {
        nickname,
        gender,
        date_of_birth: dateOfBirth,
        country,
        state,
        profile_picture_url: profilePictureUrl,
        preferred_language: preferredLanguage,
        profile_completed: true, // 🎯 Menandakan profil sudah selesai sepenuhnya
      };

      if (user.app_role === "student") {
        updateData.school_name = schoolName;
        updateData.education_level = educationLevel;
        updateData.grade_year = gradeYear;
        updateData.school_year = educationLevel;
        updateData.learning_preferences = {
          daily_goal_minutes: dailyGoalMinutes,
          favorite_subjects: favoriteSubjectsList,
          difficulty_preference: difficultyPreference,
        };
      } else if (user.app_role === "parent") {
        updateData.phone_number = phoneNumber;
        updateData.num_children = parseInt(numChildren);
        updateData.children_names = childrenNames;
        updateData.notification_preferences = {
          email_notifications: emailNotifications,
          parent_progress_reports: progressReports,
          weekly_achievement_summary: weeklySummary,
          quiz_reminders: learningAlerts,
        };
      } else if (user.app_role === "teacher") {
        updateData.teaching_subjects = teachingSubjects;
        updateData.teaching_level = teachingLevel;
        updateData.notification_preferences = {
          email_notifications: emailNotifications,
          quiz_reminders: learningAlerts,
        };
      }
      
      // 1. Kemaskini data profil ke dalam pangkalan data
      await base44.auth.updateMe(updateData);
      
      // 🔄 2. SELESAI: Paksa SDK mengambil data baharu secara nyata untuk mengemaskini cache sesi
      const refreshedUser = await base44.auth.me();
      const finalRole = refreshedUser?.app_role || user?.app_role;

      if (finalRole === "student") {
        try {
          const wallets = await base44.entities.Wallet.filter({ student_id: user.id });
          if (wallets.length === 0) {
            await base44.entities.Wallet.create({ student_id: user.id, balance: 0 });
          }
          const progress = await base44.entities.Progress.filter({ student_id: user.id });
          if (progress.length === 0) {
            await base44.entities.Progress.create({ student_id: user.id, total_xp: 0, level: 1, streak_days: 0, total_study_time: 0 });
          }
        } catch (entityErr) {
          console.error("Gagal mencipta entiti tambahan:", entityErr);
        }
      }

      toast({ 
        title: "Profil Selesai! 🎉", 
        description: "Selamat datang ke dunia StudyQuest!",
        duration: 2000
      });
      
      // 🚀 3. SELESAI: Guna Hard Redirect untuk memintas sebarang takungan sekatan Route Guard lama
      setTimeout(() => {
        const targetPath = finalRole === "student" 
          ? "/student/dashboard" 
          : finalRole === "parent" 
            ? "/parent/dashboard" 
            : "/login";
            
        globalThis.location.href = targetPath;
      }, 500);

    } catch (err) {
      toast({ 
        title: "❌ Gagal Menyimpan", 
        description: err.message || "Sila cuba sebentar lagi.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };
