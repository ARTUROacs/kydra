const bg = document.querySelector('.bg')

const FALLBACK = '../../art/header.png'
const FALLBACKBG = '../../art/bg.png'

function setBackground(url) {
    bg.style.backgroundImage = `url(${url})`

    const test = new Image()

    test.onerror = () => {
        bg.style.backgroundImage = `url(${FALLBACK})`
    }

    test.src = url
}

function normalizeItch(game) {
    return {
        name: game.title,
        price: 0,
        discount: 0,
        image: game.image || FALLBACK,
        appid: null,
        link: game.link,
        source: "itch"
    }
}

async function loadDeals() {

    const [steamDeals, itchDealsRaw] = await Promise.all([
        window.kydraAPI.getSteamDeals?.() || [],
        window.kydraAPI.getItchDeals?.() || []
    ])

    const itchDeals = (itchDealsRaw || []).map(normalizeItch)

    const deals = [
        ...steamDeals.map(g => ({ ...g, source: "steam" })),
        ...itchDeals
    ]

    const container = document.getElementById('deals')

    container.innerHTML = ''

    const sliced = deals.slice(0, 10)

    const assets = await Promise.all(
        sliced.map(g =>
            g.source === "steam"
                ? window.kydraAPI.getAssets(g.appid)
                : null
        )
    )

    sliced.forEach((game, i) => {

        const img =
            assets[i]?.header ||
            game.image ||
            FALLBACK

        const card = document.createElement('div')
        card.className = 'card'

        card.innerHTML = `
            <img 
                src="${img}"
                onerror="this.onerror=null;this.src='${FALLBACK}'"
            >

            <div class="card-content">
                <div>${game.name}</div>

                <div>
                    ${
                        game.source === "steam"
                            ? `R$ ${(game.price / 100).toFixed(2)}`
                            : `itch.io`
                    }
                </div>

                <small>${game.discount || 0}% OFF</small>

                <div class="card-source">
                    ${game.source === "steam" ? "Steam" : "itch.io"}
                </div>
            </div>
        `

        if (game.source === "steam") {
            card.addEventListener('click', () => {
                window.kydraAPI.openStorePage(game.appid)
            })
        }

        card.addEventListener('mouseenter', () => {
            setBackground(img)
        })

        container.appendChild(card)
    })

    if (sliced[0]) {
        const firstImg =
            assets[0]?.header ||
            sliced[0].image ||
            FALLBACK

        setBackground(firstImg)
    }
}

loadDeals()