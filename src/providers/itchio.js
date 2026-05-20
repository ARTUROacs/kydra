const https = require("https")
const { URL } = require("url")
const cheerio = require("cheerio")

function fetch(url, redirects = 0) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url)

        const options = {
            hostname: parsed.hostname,
            path: `${parsed.pathname}${parsed.search}`,
            protocol: parsed.protocol,
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Connection": "close"
            }
        }

        const req = https.request(options, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                const location = res.headers.location
                if (location && redirects < 5) {
                    const nextUrl = location.startsWith("http") ? location : new URL(location, url).href
                    resolve(fetch(nextUrl, redirects + 1))
                    res.resume()
                    return
                }
            }

            let data = ""

            res.on("data", chunk => data += chunk)
            res.on("end", () => resolve({
                text: () => Promise.resolve(data)
            }))
        })

        req.on("error", reject)
        req.end()
    })
}

async function getItchDeals() {
    const url = "https://itch.io/games/on-sale"

    try {
        const res = await fetch(url)
        const html = await res.text()

        const $ = cheerio.load(html)

        const games = []

        $(".game_cell").each((_, el) => {

            const title = $(el).find(".title").text().trim()

            const link = $(el)
                .find(".game_link")
                .attr("href")

            const image =
                $(el)
                    .find(".thumb_link img")
                    .attr("src") ||
                $(el)
                    .find(".thumb_link img")
                    .attr("data-lazy_src")

            const price = $(el)
                .find(".price_value")
                .first()
                .text()
                .trim()

            const discount = $(el)
                .find(".sale_tag")
                .first()
                .text()
                .replace("%", "")
                .replace("-", "")
                .trim()

            const author = $(el)
                .find(".game_author")
                .text()
                .trim()

            if (title && link) {
                games.push({
                    title,
                    link,
                    image,
                    price,
                    discount: discount || 0,
                    author
                })
            }
        })

        return games

    } catch (err) {
        console.error("Error on scraping Itch.io:", err)
        return []
    }
}

module.exports = {
    getItchDeals
}