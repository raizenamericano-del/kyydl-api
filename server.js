import express from 'express';
import cors from 'cors';
import https from 'https';

const app = express();
app.use(cors());
app.use(express.json());

// Helper fetch
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({}); }
      });
    }).on('error', reject);
  });
}

app.get('/', (req, res) => {
  res.json({ status: 'KyyDL API 🔥', mode: 'Railway (API External)' });
});

// Info video via API eksternal
app.get('/api/info', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    // Coba API Akuari (YouTube, TikTok, IG, FB, Twitter)
    const akuari = `https://api.akuari.my.id/downloader/youtube?link=${encodeURIComponent(url)}`;
    const data = await fetchJSON(akuari);
    
    if (data.respon && data.respon.url) {
      return res.json({
        title: data.respon.title || "Video",
        thumbnail: data.respon.thumb || `https://img.youtube.com/vi/${extractId(url)}/0.jpg`,
        duration: data.respon.duration || "Unknown",
        uploader: data.respon.channel || "Unknown",
        qualities: ["360p", "720p", "1080p"],
        formats: ["mp4", "mp3"],
        downloadUrl: data.respon.url,
        platform: detectPlatform(url)
      });
    }
    
    // Fallback preview
    res.json({
      title: "Preview Only",
      thumbnail: `https://img.youtube.com/vi/${extractId(url)}/0.jpg`,
      qualities: ["720p"],
      formats: ["mp4"],
      source_url: url,
      platform: detectPlatform(url),
      note: "Use /api/download for direct link"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download link
app.get('/api/download', async (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const akuari = `https://api.akuari.my.id/downloader/youtube?link=${encodeURIComponent(url)}`;
    const data = await fetchJSON(akuari);
    
    if (data.respon && data.respon.url) {
      return res.json({
        success: true,
        downloadUrl: data.respon.url,
        title: data.respon.title,
        thumbnail: data.respon.thumb,
        format: format || "mp4",
        quality: "HD",
        platform: detectPlatform(url)
      });
    }
    
    // Fallback redirect
    res.json({
      success: true,
      downloadUrl: `https://savefrom.net/?url=${encodeURIComponent(url)}`,
      format: format || "mp4",
      fallback: true,
      message: "External download link"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function extractId(url) {
  const match = url.match(/(?:v=|\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : 'unknown';
}

function detectPlatform(url) {
  if (url.includes('youtube') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('tiktok')) return 'TikTok';
  if (url.includes('instagram')) return 'Instagram';
  if (url.includes('facebook')) return 'Facebook';
  if (url.includes('twitter') || url.includes('x.com')) return 'Twitter/X';
  if (url.includes('spotify')) return 'Spotify';
  if (url.includes('soundcloud')) return 'SoundCloud';
  if (url.includes('reddit')) return 'Reddit';
  if (url.includes('vimeo')) return 'Vimeo';
  return 'Unknown';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 KyyDL API on Railway port ${PORT}`));
