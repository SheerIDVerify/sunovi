export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { title, tags, lyrics, model, instrumental } = req.body;

  try {
    const response = await fetch("https://api.kie.ai/v1/suno", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        tags,
        lyrics,
        model: model || "v5",
        instrumental: instrumental || false,
      }),
    });

    const result = await response.json();

    if (!result || !result.taskId)
      return res.status(400).json({ error: "No taskId returned" });

    // Poll hasilnya
    let songData;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 4000));
      const poll = await fetch(`https://api.kie.ai/v1/suno/${result.taskId}`, {
        headers: { "Authorization": `Bearer ${process.env.KIE_API_KEY}` },
      });
      songData = await poll.json();
      if (songData.status === "completed") break;
    }

    if (!songData.audio_url) return res.status(500).json({ error: "Gagal ambil hasil" });
    res.status(200).json({ audio_url: songData.audio_url });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
        }
