const axios = require('axios')
const cheerio = require('cheerio')

const version = fetch('https://raw.githubusercontent.com/k7sistemas/kydra/refs/heads/main/version.txt')

async function fetchDeals() {

    const { data } = await axios.get(
        'https://itch.io/games/on-sale',
        {
            headers: {
                'User-Agent': `KydraLauncher/${version}`
            }
        }
    )

    const $ = cheerio.load(data)

    const games = []

    $('.game_cell').each((i, el) => {

        const title = $(el)
            .find('.title.game_link')
            .text()
            .trim()

        const url = $(el)
            .find('.title.game_link')
            .attr('href')

        const image =
            $(el).find('img').attr('data-lazy_src') ||
            $(el).find('img').attr('src')

        const price =
            $(el)
                .find('.price_value')
                .text()
                .trim() || 'FREE'

        const discount = $(el)
            .find('.sale_tag')
            .text()
            .trim()

        const author = $(el)
            .find('.game_author a')
            .text()
            .trim()

        const genre = $(el)
            .find('.game_genre')
            .text()
            .trim()

        const description = $(el)
            .find('.game_text')
            .text()
            .trim()

        const platforms = []
        $(el)
            .find('.game_platform span[title]')
            .each((i, span) => {
                const title = $(span).attr('title') || ''
                const name = title.replace(/^Download for /i, '').trim()
                if (name)
                    platforms.push(name)
            })

        const gameId = $(el).attr('data-game_id')

        if (!discount.includes('%'))
            return

        games.push({
            gameId,
            title,
            author,
            genre,
            description,
            price,
            discount,
            image,
            url,
            platforms
        })
    })

    return games
}

module.exports = {
    fetchDeals
}