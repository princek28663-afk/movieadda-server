// /streaming-server/server.js

const express = require('express');
const cors = require('cors');
const { scrapeVidsrc } = require('@definisi/vidsrc-scraper'); // नई लाइब्रेरी

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

async function resolveStream(tmdbId, type, season, episode) {
    try {
        let result;

        if (type === 'movie') {
            // मूवी के लिए: TMDB ID और 'movie' टाइप
            result = await scrapeVidsrc(tmdbId.toString(), 'movie');
        } else {
            // वेब सीरीज़ के लिए: TMDB ID, 'tv', सीज़न, एपिसोड
            result = await scrapeVidsrc(tmdbId.toString(), 'tv', season.toString(), episode.toString());
        }

        if (result && result.success && result.hlsUrl) {
            console.log(`✅ असली स्ट्रीम मिल गई: ${result.hlsUrl}`);
            return {
                success: true,
                tmdbId: tmdbId,
                type: type,
                streamUrl: result.hlsUrl, // असली .m3u8 लिंक
                // यह लाइब्रेरी खुद बताती है कि कौन सा रेफरर चाहिए
                referer: 'https://cloudnestra.com/',
                subtitles: result.subtitles || []
            };
        } else {
            throw new Error('स्क्रैपर से कोई स्ट्रीम URL नहीं मिला।');
        }

    } catch (error) {
        console.error(`❌ TMDB ID ${tmdbId} के लिए स्क्रैपिंग फेल:`, error.message);
        // फेल होने पर iframe फॉलबैक (ताकि यूज़र को कुछ तो दिखे)
        return {
            success: false,
            error: 'स्ट्रीम रिज़ॉल्व नहीं हो पाया',
            iframeUrl: type === 'movie'
                ? `https://vidsrc.net/embed/movie?tmdb=${tmdbId}`
                : `https://vidsrc.net/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
        };
    }
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
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
    console.log(`🎬 Streaming server running on http://localhost:${PORT}`);
});
