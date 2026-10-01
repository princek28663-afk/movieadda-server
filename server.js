// /streaming-server/server.js

const express = require('express');
const cors = require('cors');
// vidsrc.ts से डिफ़ॉल्ट फंक्शन इम्पोर्ट करें
const tmdbScrape = require('vidsrc.ts').default;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

async function resolveStream(tmdbId, type, season, episode) {
    try {
        let result;
        if (type === 'movie') {
            // मूवी के लिए: TMDB ID और टाइप 'movie' पास करें
            result = await tmdbScrape(tmdbId.toString(), "movie");
        } else {
            // वेब सीरीज़ के लिए: सीज़न और एपिसोड भी पास करें
            result = await tmdbScrape(tmdbId.toString(), "tv", season, episode);
        }

        // vidsrc.ts एक एरे रिटर्न करता है, पहला रिजल्ट लें
        if (result && result.length > 0 && result[0].stream) {
            console.log(`✅ Stream found for TMDB ID ${tmdbId}`);
            return {
                success: true,
                tmdbId: tmdbId,
                type: type,
                streamUrl: result[0].stream, // असली .m3u8 लिंक
                referer: result[0].referer || "https://cloudnestra.com/", // ज़रूरी हेडर[reference:1]
                sourceName: result[0].name || 'vidsrc'
            };
        } else {
            throw new Error('No stream source found in scraper response.');
        }
    } catch (error) {
        console.error(`❌ Scraping failed for TMDB ID ${tmdbId}:`, error.message);
        return {
            success: false,
            error: 'Stream resolve failed',
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
