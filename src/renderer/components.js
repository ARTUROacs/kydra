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

async function loadDeals() {

    const deals = await window.kydraAPI.getDeals?.() || []
    const container = document.getElementById('deals')

    container.innerHTML = ''

    const sliced = deals.slice(0, 10)

    const assets = await Promise.all(
        sliced.map(g => window.kydraAPI.getAssets(g.appid))
    )

    sliced.forEach((game, i) => {

        const img = assets[i]?.header || game.image || FALLBACK

        const card = document.createElement('div')
        card.className = 'card'

        card.innerHTML = `
            <img 
                src="${img}"
                onerror="this.onerror=null;this.src='${FALLBACK}'"
            >

            <div class="card-content">
                <div>${game.name}</div>
                <div>R$ ${(game.price / 100).toFixed(2)}</div>
                <small>${game.discount}% OFF</small>
            </div>
        `

        card.addEventListener('mouseenter', () => {
            setBackground(img)
        })

        container.appendChild(card)
    })

    if (sliced[0]) {
        const firstImg = assets[0]?.header || sliced[0].image || FALLBACK
        setBackground(firstImg)
    }
}

loadDeals()