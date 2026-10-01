// /streaming-server/server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const TMDB_KEY = process.env.TMDB_API_KEY;

// 🎯 यहाँ आप अपने असली सोर्स रेज़ॉल्वर को लगाओ
// डेमो के लिए हम vidsrc-प्रकार का सोर्स इस्तेमाल कर रहे हैं
async function resolveStream(tmdbId, type, season, episode) {
    // असली दुनिया में आपको यहाँ अपना स्क्रैपर / API लगाना होगा
    // नीचे डेमो स्ट्रीम है (Big Buck Bunny – public test video)
    const demoStreams = {
        movie: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        tv: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    };

    return {
        success: true,
        tmdbId,
        type,
        season: type === 'tv' ? season : null,
        episode: type === 'tv' ? episode : null,
        streamUrl: demoStreams[type] || demoStreams.movie,
        // असली सोर्स के लिए यहाँ iframe URL भी दे सकते हैं
        iframeUrl: type === 'movie'
            ? `https://vidsrc.net/embed/movie?tmdb=${tmdbId}`
            : `https://vidsrc.net/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
    };
}

// 🎬 स्ट्रीम लिंक देने वाला endpoint
app.get('/watch/:type/:tmdbId', async (req, res) => {
    try {
        const { type, tmdbId } = req.params;
        const season = parseInt(req.query.season) || 1;
        const episode = parseInt(req.query.episode) || 1;

        if (!['movie', 'tv'].includes(type)) {
            return res.status(400).json({ error: 'Invalid type' });
        }
        if (!/^\d+$/.test(tmdbId)) {
            return res.status(400).json({ error: 'Invalid TMDB ID' });
        }

        const result = await resolveStream(tmdbId, type, season, episode);
        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Stream resolve failed' });
    }
});

// हेल्थ चेक
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
    console.log(`🎬 Streaming server running on http://localhost:${PORT}`);
});
