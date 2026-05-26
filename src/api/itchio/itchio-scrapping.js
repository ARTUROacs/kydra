const axios = require('axios')
const cheerio = require('cheerio')

async function getVersion() {

    try {

        const response = await axios.get(
            'https://raw.githubusercontent.com/k7sistemas/kydra/refs/heads/main/version.txt'
        )

        return response.data.trim()

    } catch {

        return 'dev'

    }

}

async function fetchDeals() {

    const version = await getVersion()

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

        let image =
            $(el).find('img').attr('data-lazy_src') ||
            $(el).find('img').attr('src')

        if (image && image.startsWith('//')) {
            image = 'https:' + image
        }

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

                const platformTitle =
                    $(span).attr('title') || ''

                const name = platformTitle
                    .replace(/^Download for /i, '')
                    .trim()

                if (name) {
                    platforms.push(name)
                }

            })

        const gameId = $(el).attr('data-game_id')

        if (!discount.includes('%')) {
            return
        }

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

async function fetchNewGames() {

    const version = await getVersion()

    const { data } = await axios.get(
        'https://itch.io/games/last-day',
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
            .find('.game_title a')
            .text()
            .trim()

        const url = $(el)
            .find('.game_title a')
            .attr('href')

        let image =
            $(el)
                .find('.game_thumb img')
                .attr('data-lazy_src') ||

            $(el)
                .find('.game_thumb img')
                .attr('src')

        if (image && image.startsWith('//')) {
            image = 'https:' + image
        }

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

                const platformTitle =
                    $(span).attr('title') || ''

                const name = platformTitle
                    .replace(/^Download for /i, '')
                    .trim()

                if (name) {
                    platforms.push(name)
                }

            })

        games.push({
            title,
            url,
            image,
            author,
            genre,
            description,
            platforms
        })

    })

    return games

}

module.exports = {
    fetchDeals,
    fetchNewGames,
    getVersion
}