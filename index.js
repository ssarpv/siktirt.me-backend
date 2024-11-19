require('dotenv').config();
const express = require('express');
const {Pool} = require('pg');

const app = express();
const pool = new Pool({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const shortCodes = ['\u{200B}', '\u{200C}', '\u{200D}', '\u{2060}', '\u{200E}', '\u{200F}'];

app.use('/', express.static('dist'));

function randomize() {
    let shortUrl = '';
    for (let i = 0; i < 16; i++) {
        shortUrl += shortCodes[Math.floor(Math.random() * shortCodes.length)];
    }
    return shortUrl;
}


function checkShortUrl(shortUrl) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT 1 FROM urls WHERE short_url = $1 LIMIT 1';

        pool.query(query, [shortUrl], (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results.rowCount > 0);
        });
    });
}

async function generateShortUrl() {
    let shortUrl = randomize();
    let exists = true;
    while (exists) {
        shortUrl = randomize();
        exists = await checkShortUrl(shortUrl);
    }
    return shortUrl;
}

app.use(express.json());

app.get('/:short', async (req, res) => {
    try {
        const shortUrl = encodeURIComponent(req.params.short);
        const query = 'SELECT * FROM urls WHERE short_url = $1';
        const {rows} = await pool.query(query, [shortUrl]);
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
    if(!req.body.url.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g)){
        res.status(400).send('Geçersiz URL');
    }
    try {
        const checkQuery = 'SELECT * FROM urls WHERE long_url = $1';
        const {rows: existingRows} = await pool.query(checkQuery, [req.body.url]);
        if (existingRows.length > 0) {
            res.send(JSON.stringify({
                shortUrl: `${decodeURIComponent(existingRows[0].short_url)}`
            }));
        } else {
            const shortUrl = encodeURIComponent(await generateShortUrl());
            const insertQuery = 'INSERT INTO urls (long_url, short_url) VALUES ($1, $2) RETURNING short_url';
            const {rows: newRows} = await pool.query(insertQuery, [req.body.url, shortUrl]);
            res.json({
                shortUrl: `${decodeURIComponent(newRows[0].short_url)}`,
            });
        }
    } catch (e) {
        console.error("Error: ", e);
        res.status(500).send('Sunucu hatası.');
    }
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});