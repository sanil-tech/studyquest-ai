// ============================================================================
  // HANDLER: LINK AN EXISTING STUDENT BY ID (Modified for SQ... format)
  // ============================================================================
  const handleLinkExistingId = async (e) => {
    e.preventDefault();
    const targetId = studentIdInput.trim(); // Expecting something like SQ10023

    if (!targetId) {
      setLinkError("Please provide a valid Student ID (e.g., SQ10001).");
      return;
    }

    setLoading(true);
    setLinkError("");

    try {
      const currentUser = await base44.auth.me();

      // 1. Verify target student exists via the custom 'student_id' field instead of database internal ID
      const studentsFound = await base44.entities.User.filter({
        student_id: targetId
      });

      if (!studentsFound || studentsFound.length === 0) {
        throw new Error("No active student record matches this Student ID.");
      }

      const targetedStudent = studentsFound[0];

      if (currentUser.id === targetedStudent.id) {
        throw new Error("You cannot bind your own account profile to yourself.");
      }

      // 2. Prevent duplicate active relationships
      const dynamicMatches = await base44.entities.ParentChildRelationship.filter({
        parent_id: currentUser.id,
        child_id: targetedStudent.id,
        status: "active",
      });

      if (dynamicMatches && dynamicMatches.length > 0) {
        throw new Error("This child account is already connected to your parental dashboard.");
      }

      // 3. Mount the new linkage node using the resolved internal user ID
      await base44.entities.ParentChildRelationship.create({
        parent_id: currentUser.id,
        child_id: targetedStudent.id,
        status: "active",
      });

      toast({
        title: "Account Linked Successfully! 🎉",
        description: `Bound ${getDisplayName(targetedStudent)} to your profile portal layout view.`,
      });

      setStudentIdInput("");
      onLinked?.();
      onChildAdded?.();
      onClose?.();
      onOpenChange?.(false);
    } catch (err) {
      setLinkError(err.message || "Database validation pipeline exception occurred.");
    } finally {
      setLoading(false);
    }
  };