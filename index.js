require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const zeroWidthCodes = ['\u{200B}', '\u{200C}', '\u{200D}', '\u{2060}', '\u{200E}', '\u{200F}'];
const shortCodes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

app.use('/', express.static('dist'));

function randomize(arr, len) {
    let random = '';
    for (let i = 0; i < len; i++) {
        random += arr[Math.floor(Math.random() * arr.length)];
    }
    return random;
}


function checkShortUrl({ shortUrl }) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM urls WHERE short_url=$1 OR zero_width_url=$1 LIMIT 1;';

        pool.query(query, [shortUrl], (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results.rowCount > 0);
        });
    });
}

async function generateShortUrl() {
    let urls = [{ type: "short", urlLength: 8, url: "", exists: true }, { type: "zeroWidth", urlLength: 16, url: "", exists: true }]
    for (const urlElement of urls) {
        while (urlElement.exists) {
            urlElement.url = randomize(shortCodes, urlElement.urlLength);
            urlElement.exists = await checkShortUrl(urlElement.url);
        }
    }
    return urls;
}

app.use(express.json());

app.get('/:short', async (req, res) => {
    try {
        const shortUrl = encodeURIComponent(req.params.short);
        const query = 'SELECT * FROM urls WHERE short_url=$1 OR zero_width_url=$1 LIMIT 1;';
        const { rows } = await pool.query(query, [shortUrl]);
        if (rows.length > 0) {
            res.redirect(301, rows[0].long_url);
        } else {
            res.send("İstenilen URL bulunamadı");
        }
    } catch (e) {
        console.error("Error: ", e);
        res.status(500).send('Sunucu hatası.');
    }
});

app.post('/short', async (req, res) => {
    if (!req.body.url.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g)) {
        return res.status(400).send('Geçersiz URL');
    }
    try {
        const checkQuery = 'SELECT * FROM urls WHERE long_url=$1 LIMIT 1;';
        const { rows: existingRows } = await pool.query(checkQuery, [req.body.url]);
        if (existingRows.length > 0) {
            console.log(existingRows);
            return res.send(JSON.stringify({
                shortUrl: `${decodeURIComponent(existingRows[0].short_url)}`,
                zeroWidthUrl: `${decodeURIComponent(existingRows[0].zero_width_url)}`
            }));
        } else {
            const urls = await generateShortUrl();
            console.log(urls)
            const shortUrl = encodeURIComponent(urls[0].url);
            const zeroWidthUrl = encodeURIComponent(urls[1].url);
            const insertQuery = 'INSERT INTO urls (long_url, short_url, zero_width_url) VALUES ($1, $2, $3) RETURNING short_url, zero_width_url';
            const { rows: newRows } = await pool.query(insertQuery, [req.body.url, shortUrl, zeroWidthUrl]);
            console.log(newRows);
            return res.json({
                shortUrl: `${decodeURIComponent(newRows[0].short_url)}`,
                zeroWidthUrl: `${decodeURIComponent(newRows[0].zero_width_url)}`
            });
        }
    } catch (e) {
        console.error("Error: ", e);
        return res.status(500).send('Sunucu hatası.');
    }
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});