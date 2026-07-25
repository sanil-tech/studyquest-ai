import { hashPin, generateStudentId } from "@/lib/credentials";

// ... inside AddChildModal.jsx handleRegisterChild function:
const handleRegisterChild = async () => {
  if (form.pin.length !== 4) {
    toast({ title: "PIN tidak sah", description: "PIN mestilah tepat 4 digit.", variant: "destructive" });
    return;
  }

  setLoading(true);
  try {
    const me = await base44.auth.me();
    if (!me?.id) throw new Error("Sesi log masuk ibu bapa tidak ditemui.");

    const cleanNickname = form.nickname.trim();
    const usernameMaya = `${cleanNickname.toLowerCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const studentId = generateStudentId();
    const isEmoji = !form.selectedAvatar.startsWith("http");

    const newStudent = await base44.entities.User.create({
      app_role: "student",
      nickname: cleanNickname,
      full_name: form.fullName.trim() || cleanNickname,
      username: usernameMaya,
      student_id: studentId,
      pin_hash: hashPin(form.pin),
      child_login_pin: form.pin,
      pin_enabled: true,
      login_method: "both",
      is_child_account: true,
      profile_completed: true,
      linked_parent_id: me.id,
      selected_avatar: form.selectedAvatar,
      avatar_emoji: isEmoji ? form.selectedAvatar : null,
      date_of_birth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
      school_name: form.school.trim() || undefined,
      education_level: form.grade || undefined,
      preferred_language: form.language,
      interests: form.interests,
    });

    if (!newStudent?.id) throw new Error("Pelayan gagal menjana ID Murid baharu.");

    const currentLinkedIds = me.linked_student_ids || [];
    await base44.entities.User.update(me.id, {
      linked_student_ids: [...currentLinkedIds, newStudent.id],
    });

    // Cache child profile locally
    const cachedChildren = JSON.parse(localStorage.getItem("cached_children") || "{}");
    cachedChildren[newStudent.id] = {
      id: newStudent.id,
      nickname: cleanNickname,
      full_name: form.fullName.trim(),
      selected_avatar: form.selectedAvatar,
      avatar_emoji: isEmoji ? form.selectedAvatar : null,
      username: usernameMaya,
      student_id: studentId,
      child_login_pin: form.pin,
    };
    localStorage.setItem("cached_children", JSON.stringify(cachedChildren));

    try {
      await base44.entities.Wallet.create({ student_id: newStudent.id, balance: 0 });
      await base44.entities.Progress.create({
        student_id: newStudent.id,
        total_xp: 0,
        level: 1,
        streak_days: 0,
        total_study_time: 0,
      });
    } catch {}

    if (typeof onChildAdded === "function") onChildAdded(newStudent);
    setIsSuccess(true);
  } catch (err) {
    toast({
      title: "Pendaftaran Gagal 🛑",
      description: err.message || "Gagal menyimpan data ke pelayan.",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
