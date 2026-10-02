// /streaming-server/server.js (मुख्य सर्वर)

const express = require('express');
const cors = require('cors');
const axios = require('axios');  // HTTP कॉल के लिए

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// 🔗 DivineChile Scraper सर्वर का URL
// अगर वह उसी मशीन पर है, तो localhost:5000 (या जो पोर्ट आपने सेट किया हो)
const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:5000';

async function resolveStream(tmdbId, type, season, episode) {
    try {
        // ───────── 1. DivineChile Scraper से स्ट्रीम URL माँगें ─────────
        const params = {
            tmdb_id: tmdbId.toString(),
            type: type  // 'movie' या 'tv'
        };

        // अगर TV सीरीज़ है, तो सीज़न और एपिसोड भी भेजें
        if (type === 'tv') {
            params.season = season.toString();
            params.episode = episode.toString();
        }

        console.log(`🔍 Scraping TMDB ID ${tmdbId} (${type})...`);
        const response = await axios.get(`${SCRAPER_URL}/extract`, {
            params: params,
            timeout: 90000  // 90 सेकंड का टाइमआउट (Playwright को समय चाहिए)
        });

        const data = response.data;

        // ───────── 2. रिस्पॉन्स से पहला काम करने वाला स्ट्रीम URL निकालें ─────────
        if (!data.success || !data.results) {
            throw new Error('स्क्रैपर से कोई परिणाम नहीं मिला');
        }

        // रिस्पॉन्स फॉर्मेट: { "https://vidsrc.xyz": { hls_url, subtitles, error }, ... }
        let streamUrl = null;
        let subtitles = [];
        let workingProvider = null;

        for (const [provider, result] of Object.entries(data.results)) {
            if (result.hls_url && !result.error) {
                streamUrl = result.hls_url;
                subtitles = result.subtitles || [];
                workingProvider = provider;
                console.log(`✅ स्ट्रीम मिल गई ${provider} से: ${streamUrl}`);
                break;  // पहला काम करने वाला स्ट्रीम ले लें
            }
        }

        if (!streamUrl) {
            throw new Error('सभी प्रोवाइडर्स से स्ट्रीम नहीं मिली');
        }

        // ───────── 3. सफल रिस्पॉन्स लौटाएँ ─────────
        return {
            success: true,
            tmdbId: tmdbId,
            type: type,
            season: type === 'tv' ? season : null,
            episode: type === 'tv' ? episode : null,
            streamUrl: streamUrl,           // असली .m3u8 लिंक
            referer: 'https://cloudnestra.com/',  // ज़रूरी हेडर
            subtitles: subtitles,
            provider: workingProvider
        };

    } catch (error) {
        console.error(`❌ TMDB ID ${tmdbId} के लिए स्क्रैपिंग फेल:`, error.message);

        // ───────── फॉलबैक: iframe URL दें (अगर स्क्रैपिंग फेल हो) ─────────
        const fallbackIframe = type === 'movie'
            ? `https://vidsrc.net/embed/movie?tmdb=${tmdbId}`
            : `https://vidsrc.net/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;

        return {
            success: false,
            error: 'स्ट्रीम रिज़ॉल्व नहीं हो पाया',
            iframeUrl: fallbackIframe
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
    console.log(`🎬 मुख्य सर्वर चल रहा है: http://localhost:${PORT}`);
    console.log(`🔗 Scraper URL: ${SCRAPER_URL}`);
});
