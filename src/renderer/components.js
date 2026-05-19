const bg = document.querySelector('.bg')

function setBackground(url) {
    bg.style.backgroundImage = `url(${url})`
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

        const img = assets[i]?.header || game.image

        const card = document.createElement('div')
        card.className = 'card'

        card.innerHTML = `
            <img src="${img}">
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
        const firstImg = assets[0]?.header || sliced[0].image
        setBackground(firstImg)
    }
}

function showVersion() {
  window.kydraAPI.getVersion?.().then(version => {
    document.querySelector('.footer-text').innerText = version
  })  
}

showVersion()
loadDeals()