const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    // 1. Ambil input username atau ID yang dimasukkan oleh anak (cth: morry2)
    const inputVal = username.trim().toLowerCase();
    
    // 2. Tukarkan ia menjadi format e-mel maya yang sepadan dengan Edge Function kita
    const fakeEmail = inputVal.includes('@') 
      ? inputVal 
      : `child-${inputVal}@studyquest.local`;

    // 3. Log masuk ke dalam sistem Auth rasmi menggunakan e-mel maya tersebut
    await base44.auth.loginViaEmailPassword(fakeEmail, password);

    // 4. Ambil data pengguna untuk memastikan sesi berjaya dikemas kini
    const user = await base44.auth.me();

    if (user) {
      // Bawa anak terus ke dashboard/ruang belajar mereka
      window.location.href = "/dashboard"; 
    }
  } catch (err) {
    console.error(err);
    setError("Username atau kata laluan salah. Sila cuba lagi.");
  } finally {
    setLoading(false);
  }
};