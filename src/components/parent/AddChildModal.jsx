const handleRegisterChild = async (e) => {
    e.preventDefault();
    if (!fullName || !pin) {
      toast({ title: "Medan Wajib", description: "Sila isi Nama dan PIN 4-Digit anak.", variant: "destructive" });
      return;
    }
    if (pin.length !== 4) {
      toast({ title: "Format PIN Salah", description: "PIN mestilah tepat 4 digit.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const me = await base44.auth.me();

      // 🎯 DIBAIKI: Casing ditukar kepada "createChildAccount" secara tepat mengikut nama folder backend
      const response = await base44.functions.invoke("createChildAccount", {
        fullName,
        nickname: nickname || fullName.split(" ")[0],
        pin,
        parentId: me.id
      });

      // Membaca data respons daripada fungsi awan pelayan
      const result = response?.data || response;

      if (result && (result.success || result.childId)) {
        onChildAdded(); // Segarkan senarai anak di dashboard parent
        setIsSuccess(true); // Paparkan tiket kejayaan PIN anak
      } else {
        throw new Error(result?.message || "Pelayan menolak pendaftaran akaun ekspres.");
      }
    } catch (err) {
      toast({
        title: "Pendaftaran Gagal 🛑",
        description: err.message || "Sila pastikan kod fungsi di folder backend tiada ralat.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
