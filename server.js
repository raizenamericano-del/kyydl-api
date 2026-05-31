import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
  res.json({ status: 'KyyDL API 🔥', endpoints: ['/api/info?url=URL', '/api/download?url=URL&format=mp4'] });
});

app.get('/api/info', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  const ytdlp = spawn('python3', ['-m', 'yt_dlp', '--dump-json', '--no-playlist', '-q', url]);
  let data = '', err = '';

  ytdlp.stdout.on('data', chunk => data += chunk);
  ytdlp.stderr.on('data', chunk => err += chunk);

  ytdlp.on('close', (code) => {
    if (code !== 0 || !data) {
      return res.status(500).json({ error: 'yt-dlp failed', detail: err });
    }
    try {
      const info = JSON.parse(data);
      const vids = info.formats?.filter(f => f.height) || [];
      const qualities = [...new Set(vids.map(f => f.height))].sort((a,b)=>b-a);
      
      res.json({
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration_string,
        uploader: info.uploader || info.channel,
        qualities: qualities.length ? qualities.map(h => `${h}p`) : ['best'],
        formats: ['mp4', 'mp3', 'webm'],
        platform: detectPlatform(url)
      });
    } catch (e) {
      res.status(500).json({ error: 'Parse error' });
    }
  });
});

app.get('/api/download', async (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  let args = ['-m', 'yt_dlp', '--no-playlist', '-q', '--get-url'];
  if (format === 'mp3') {
    args.push('-f', 'bestaudio', '--extract-audio', '--audio-format', 'mp3');
  } else {
    args.push('-f', 'best[height<=1080]');
  }
  args.push(url);

  const ytdlp = spawn('python3', args);
  let link = '', err = '';

  ytdlp.stdout.on('data', chunk => link += chunk);
  ytdlp.stderr.on('data', chunk => err += chunk);

  ytdlp.on('close', (code) => {
    if (code !== 0 || !link.trim()) {
      return res.status(500).json({ error: 'Failed to get link', detail: err });
    }
    res.json({
      success: true,
      downloadUrl: link.trim(),
      format: format || 'mp4',
      platform: detectPlatform(url)
    });
  });
});

function detectPlatform(url) {
  if (url.includes('youtube') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('tiktok')) return 'TikTok';
  if (url.includes('instagram')) return 'Instagram';
  if (url.includes('facebook')) return 'Facebook';
  if (url.includes('twitter') || url.includes('x.com')) return 'Twitter/X';
  if (url.includes('reddit')) return 'Reddit';
  if (url.includes('spotify')) return 'Spotify';
  if (url.includes('soundcloud')) return 'SoundCloud';
  if (url.includes('vimeo')) return 'Vimeo';
  return 'Unknown';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 KyyDL API on port ${PORT}`));
