const express = require('express')
const scraper = require('./itchio-scrapping')

const app = express()

app.get('/api/deals', async (req, res) => {

    try {

        const games = await scraper.fetchDeals()

        res.json({
            success: true,
            total: games.length,
            games
        })

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        })

    }
})

app.get('/api/latest', async (req, res) => {

    try {

        const games = await scraper.fetchNewGames()

        res.json({
            success: true,
            total: games.length,
            games
        })

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        })

    }
})

app.listen(3000, () => {
    console.log('API online at http://localhost:3000')
})