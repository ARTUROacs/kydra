const bg = document.querySelector('.bg')

const FALLBACK = '../../art/header.png'
const FALLBACKBG = '../../art/bg.png'

function setBackground(url) {
    if (!bg) return

    bg.style.backgroundImage = `url(${url})`

    const test = new Image()

    test.onerror = () => {
        bg.style.backgroundImage = `url(${FALLBACKBG})`
    }

    test.src = url
}

const sidebarButtons = document.querySelectorAll('.sidebar-btn')

const pages = {
    home: document.querySelector('.page-home'),
    library: document.querySelector('.page-library'),
    settings: document.querySelector('.page-settings')
}

sidebarButtons.forEach((btn, index) => {

    btn.addEventListener('click', () => {

        sidebarButtons.forEach(b => b.classList.remove('active'))

        btn.classList.add('active')

        Object.values(pages).forEach(p =>
            p.classList.add('hidden')
        )

        if (index === 0) pages.home.classList.remove('hidden')
        if (index === 1) pages.library.classList.remove('hidden')
        if (index === 2) pages.settings.classList.remove('hidden')

    })

})

function setHero(game, image) {
    const heroBanner = document.querySelector('.hero-banner')
    const heroTitle = document.querySelector('.hero-title')
    const heroDescription = document.querySelector('.hero-description')
    const primaryBtn = document.querySelector('.hero-btn.primary')
    const secondaryBtn = document.querySelector('.hero-btn.secondary')

    if (!heroBanner || !heroTitle) return

    heroBanner.src = image || FALLBACK

    heroBanner.onerror = () => {
        heroBanner.src = FALLBACK
    }

    heroTitle.textContent = game.name

    heroDescription.textContent =
        game.source === 'steam'
            ? `Enjoy ${game.discount} off on Steam!`
            : `Featured indie game on itch.io with a promotion available now.`

    primaryBtn.onclick = () => {
        if (game.source === 'steam') {
            window.kydraAPI.openStorePage?.(game.appid)
        } else {
            window.open(game.url, '_blank')
        }
    }

    secondaryBtn.onclick = () => {
        if (game.source === 'steam') {
            window.open(`https://store.steampowered.com/app/${game.appid}`, '_blank')
        } else {
            window.open(game.url, '_blank')
        }
    }
}

async function loadSteamDeals() {
    try {
        const steamDeals = await window.kydraAPI.getSteamDeals?.() || []

        return steamDeals.map(g => ({
            ...g,
            source: 'steam',
            discount: typeof g.discount_percent === 'number'
                ? `${g.discount_percent}%`
                : g.discount || '0%',
            platforms: g.platforms || []
        }))
    } catch (err) {
        console.error(err)
        return []
    }
}

function normalizeItch(game) {
    return {
        name: game.title,
        price: game.price || 'FREE',
        discount: (game.discount || '0%').replace(/^-/, ''),
        image: game.image || FALLBACK,
        appid: null,
        url: game.url,
        source: 'itch',
        platforms: game.platforms || []
    }
}

async function loadItchDeals() {
    try {
        const res = await window.kydraAPI.getItchDeals?.()
        const games = res?.games || []
        return games.map(normalizeItch)
    } catch (err) {
        console.error(err)
        return []
    }
}

function mergeDeals(steamDeals, itchDeals, limit = 10) {
    const merged = []
    const maxIndex = Math.max(steamDeals.length, itchDeals.length)

    for (let i = 0; i < maxIndex && merged.length < limit; i += 1) {
        if (i < steamDeals.length) merged.push(steamDeals[i])
        if (merged.length >= limit) break
        if (i < itchDeals.length) merged.push(itchDeals[i])
    }

    return merged
}

async function loadDeals() {
    const container = document.getElementById('deals')
    if (!container) return

    container.innerHTML = ''

    const [steamDeals, itchDeals] = await Promise.all([
        loadSteamDeals(),
        loadItchDeals()
    ])

    const deals = mergeDeals(steamDeals, itchDeals, 20)

    const assets = await Promise.all(
        deals.map(async g => {
            try {
                if (g.source !== 'steam') return null
                return await window.kydraAPI.getAssets(g.appid)
            } catch (e) {
                return null
            }
        })
    )

    if (deals[0]) {
        const heroImg = assets[0]?.header || deals[0].image || FALLBACK

        setHero(deals[0], heroImg)
        setBackground(heroImg)
    }

    deals.forEach((game, i) => {
        const img = assets[i]?.header || game.image || FALLBACK

        const card = document.createElement('div')
        card.className = 'card'

        card.innerHTML = `
            <img src="${img}" onerror="this.src='${FALLBACK}'">

            <div class="card-content">
                <div class="card-title">${game.name}</div>

                <div class="card-price">
                    ${game.source === 'steam'
                        ? `R$ ${(game.price / 100).toFixed(2)}`
                        : game.price}
                </div>

                <small class="card-discount">${game.discount} OFF</small>

                <div class="card-platforms">
                    ${(game.platforms || []).map(p =>
                        `<span class="platform-badge">${p}</span>`
                    ).join('')}
                </div>

                <div class="card-source">
                    ${game.source === 'steam' ? 'Steam' : 'itch.io'}
                </div>
            </div>
        `

        card.addEventListener('mouseenter', () => {
            setBackground(img)
        })

        card.addEventListener('click', () => {
            if (game.source === 'steam') {
                window.kydraAPI.openStorePage?.(game.appid)
            } else {
                window.open(game.url, '_blank')
            }
        })

        container.appendChild(card)
    })
}

document.addEventListener('DOMContentLoaded', () => {
    loadDeals()
})