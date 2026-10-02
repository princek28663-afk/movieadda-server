const { scrapeVidsrc } = require('@definisi/vidsrc-scraper');

async function resolveStream(tmdbId, type, season, episode) {
    try {
        let result;
        if (type === 'movie') {
            result = await scrapeVidsrc(tmdbId.toString(), 'movie');
        } else {
            result = await scrapeVidsrc(tmdbId.toString(), 'tv', season.toString(), episode.toString());
        }

        if (result && result.success && result.hlsUrl) {
            return {
                success: true,
                tmdbId: tmdbId,
                type: type,
                streamUrl: result.hlsUrl,
                referer: 'https://cloudnestra.com/',
                subtitles: result.subtitles || []
            };
        }
        throw new Error('No stream URL found');
    } catch (error) {
        console.error(`Scraping failed for ${tmdbId}:`, error.message);
        return { success: false, error: 'Stream resolve failed' };
    }
}
