export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { title, tags, lyrics, model, instrumental } = req.body;

  try {
    // langkah 1 — buat task generate lagu
    const createTask = await fetch("https://api.kie.ai/v1/suno", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title || "Tanpa Judul",
        tags: tags || "pop, chill",
        lyrics: lyrics || "",
        model: model || "chirp-v5",
        mode: "custom",
        instrumental: instrumental || false,
      }),
    });

    const result = await createTask.json();

    if (!result || !result.taskId) {
      console.log("Response dari server:", result);
      return res.status(400).json({ error: "No taskId returned. Cek body request!" });
    }

    const taskId = result.taskId;
    let audioUrl = null;

    // langkah 2 — polling sampai lagu selesai
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 5000)); // tunggu 5 detik
      const poll = await fetch(`https://api.kie.ai/v1/suno/${taskId}`, {
        headers: { "Authorization": `Bearer ${process.env.KIE_API_KEY}` },
      });
      const pollData = await poll.json();

      console.log("Status:", pollData.status);

      if (pollData.status === "completed" && pollData.audio_url) {
        audioUrl = pollData.audio_url;
        break;
      }
    }

    if (!audioUrl) {
      return res.status(500).json({ error: "Gagal mendapatkan audio_url dari task." });
    }

    return res.status(200).json({ audio_url: audioUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
          }
