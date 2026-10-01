const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Root Test Route
app.get('/', (req, res) => {
    res.send('<h2>🚀 MovieAdda Clean Server is Live!</h2>');
});

// 2. Movie & TV Streaming Route (NO TELEGRAM POPUPS)
app.get('/watch/:type/:id/:season?/:episode?', (req, res) => {
    const { type, id, season, episode } = req.params;

    // Clean Provider URLs (Jisme koi Telegram popup nahi aata)
    let streamUrl = '';
    if (type === 'tv' && season && episode) {
        streamUrl = `https://vidlink.pro/tv/${id}/${season}/${episode}`;
    } else {
        streamUrl = `https://vidlink.pro/movie/${id}`;
    }

    // 100% Clean MovieAdda Wrapper
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MovieAdda Player</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { background: #000; overflow: hidden; }
                iframe { width: 100vw; height: 100vh; border: none; display: block; }
                
                /* MovieAdda Custom Watermark */
                .watermark {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    z-index: 10;
                    background: rgba(0, 0, 0, 0.8);
                    border: 1px solid rgba(229, 9, 20, 0.6);
                    color: #fff;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    pointer-events: none;
                    backdrop-filter: blur(8px);
                }
                .dot { width: 7px; height: 7px; background: #e50914; border-radius: 50%; box-shadow: 0 0 8px #e50914; }
            </style>
        </head>
        <body>
            <div class="watermark">
                <span class="dot"></span>
                <span>MovieAdda Private Node</span>
            </div>
            
            <iframe 
                src="${streamUrl}" 
                allowfullscreen="true" 
                webkitallowfullscreen="true" 
                mozallowfullscreen="true" 
                playsinline
                sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                referrerpolicy="no-referrer">
            </iframe>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`MovieAdda Server running on port ${PORT}`);
});
