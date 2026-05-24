const FALLBACK = '../../art/header.png'
const FALLBACKBG = '../../art/bg.png'

let bg = null
let selectedGame = null
let preferences = { theme: 'dark', currency: 'USD', steamDeals: true, itchDeals: true, language: 'pt' }
let USD_TO_BRL = 5.01
let currentVersion = null
let currentLanguage = 'pt'
let translations = {}

async function fetchExchangeRate() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const data = await response.json()
    USD_TO_BRL = data?.rates?.BRL || 5.01
  } catch {
    USD_TO_BRL = 5.01
  }
}

async function loadPreferences() {
  try {
    if (window.kydraAPI?.preferences?.load) {
      const prefs = await window.kydraAPI.preferences.load()
      preferences = { ...preferences, ...(prefs || {}) }
    }
  } catch (err) {
    console.error('Failed to load preferences:', err)
  }
}

async function setPreference(key, value) {
  try {
    preferences[key] = value
    if (window.kydraAPI?.preferences?.set) {
      await window.kydraAPI.preferences.set(key, value)
    }
  } catch (err) {
    console.error('Failed to save preference:', err)
  }
}

function convertUSDToBRL(value) {
  return value * USD_TO_BRL
}

function formatPrice(value, currency = 'USD') {
  if (value === null || value === undefined) return 'FREE'

  const numeric = typeof value === 'string'
    ? parseFloat(value.replace('$', '').replace(',', '.'))
    : value

  if (isNaN(numeric)) return value

  if (currency === 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(convertUSDToBRL(numeric))
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(numeric)
}

function applyTheme() {
  document.body.setAttribute('data-theme', preferences.theme || 'dark')
}

async function refreshUI() {
  await loadPreferences()
  applyTheme()
  await loadDeals()

  if (selectedGame) {
    await setGamePage(selectedGame, selectedGame.image)
  }
}

async function loadTranslations(language = currentLanguage) {
  try {
    if (window.kydraAPI?.getAllTranslations) {
      translations = await window.kydraAPI.getAllTranslations(language)
      currentLanguage = language
    }
  } catch (err) {
    console.error('Failed to load translations:', err)
  }
}

function t(key, variables = {}) {
  if (window.kydraAPI?.getTranslation) {
    return window.kydraAPI.getTranslation(key, currentLanguage, variables)
  }
  return key
}

async function setLanguage(language) {
  await loadTranslations(language)
  await setPreference('language', language)
  await refreshUI()
}

function setBackground(url) {
  if (!bg) return

  bg.style.backgroundImage = `url(${url})`

  const test = new Image()
  test.onerror = () => {
    bg.style.backgroundImage = `url(${FALLBACKBG})`
  }
  test.src = url
}

function stripHTML(text) {
  return text?.replace(/<[^>]*>/g, '').trim() || ''
}

function parseVersion(versionString) {
  const match = versionString.match(/(\d+)\.(\d+)\.(\d+)([a-z])?/i)
  if (!match) return null
  return {
    year: parseInt(match[1]),
    month: parseInt(match[2]),
    day: parseInt(match[3]),
    suffix: match[4] || '',
    original: versionString
  }
}

function compareVersions(v1, v2) {
  const p1 = parseVersion(v1)
  const p2 = parseVersion(v2)
  if (!p1 || !p2) return 0
  if (p1.year !== p2.year) return p1.year - p2.year
  if (p1.month !== p2.month) return p1.month - p2.month
  if (p1.day !== p2.day) return p1.day - p2.day
  return p1.suffix.localeCompare(p2.suffix)
}

function showUpdateNotification(newVersion) {
  const existing = document.getElementById('update-notification')
  if (existing) existing.remove()
  const notif = document.createElement('div')
  notif.id = 'update-notification'
  notif.style.cssText = 'position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000; font-weight: 500; max-width: 300px;'
  notif.innerHTML = '<div style="font-size: 14px; margin-bottom: 8px;">Atualização disponível!</div><div style="font-size: 12px; opacity: 0.9; margin-bottom: 12px;">Versão ' + newVersion + ' está pronta</div><button onclick="location.reload()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">Atualizar agora</button>'
  document.body.appendChild(notif)
  setTimeout(() => { if (notif.parentNode) notif.remove() }, 10000)
}

async function getVersion() {
  const footer = document.querySelector('.footer-text')
  const versionElement = document.getElementById('app-version')

  if (!footer) return

  try {
    const version = window.kydraAPI?.getVersion ? await window.kydraAPI.getVersion() : 'Unknown Version'
    currentVersion = version
    footer.textContent = version
    if (versionElement) versionElement.textContent = version
  } catch {
    footer.textContent = 'Unknown Version'
    if (versionElement) versionElement.textContent = 'Unknown Version'
  }
}

async function checkForUpdates() {
  if (!currentVersion || currentVersion === 'Unknown Version') return
  try {
    if (window.kydraAPI?.checkUpdates) {
      const latestVersion = await window.kydraAPI.checkUpdates()
      if (latestVersion && compareVersions(latestVersion, currentVersion) > 0) {
        showUpdateNotification(latestVersion)
      }
    }
  } catch (err) {
    console.error('Failed to check for updates:', err)
  }
}

let sidebarButtons = null
let pages = null

function initializePageElements() {
  if (sidebarButtons) return
  sidebarButtons = document.querySelectorAll('.sidebar-btn')
  pages = {
    home: document.querySelector('.page-home'),
    game: document.querySelector('.page-game'),
    library: document.querySelector('.page-library'),
    settings: document.querySelector('.page-settings')
  }
  sidebarButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      sidebarButtons.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      if (index === 0) showPage(pages.home)
      if (index === 1) showPage(pages.library)
      if (index === 2) showPage(pages.settings)
    })
  })
}

function showPage(pageToShow) {
  if (!pages) return
  Object.values(pages).forEach(page => {
    if (page === pageToShow) {
      page.classList.remove('hidden')
      requestAnimationFrame(() => {
        page.style.opacity = '1'
        page.style.transform = 'translateY(0px)'
      })
    } else {
      page.style.opacity = '0'
      page.style.transform = 'translateY(10px)'
      setTimeout(() => {
        page.classList.add('hidden')
      }, 250)
    }
  })
}

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
  heroDescription.textContent = game.source === 'steam'
    ? `Enjoy ${game.discount} off on Steam!`
    : `Featured indie game on itch.io with a promotion available now.`

  primaryBtn.onclick = () => {
    if (game.source === 'steam') {
      if (window.kydraAPI?.openStorePage) {
        window.kydraAPI.openStorePage(game.appid)
      } else {
        window.open(`https://store.steampowered.com/app/${game.appid}`, '_blank')
      }
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

async function setGamePage(game, image) {
  selectedGame = game

  const title = document.querySelector('.game-title')
  const tag = document.querySelector('.game-tag')
  const description = document.querySelector('.game-description')
  const hero = document.querySelector('.game-hero-bg')
  const logo = document.querySelector('.game-logo')
  const genre = document.querySelector('.game-genre')
  const platforms = document.querySelector('.game-platforms')
  const price = document.querySelector('.game-price')
  const release = document.querySelector('.game-release')
  const aboutText = document.querySelector('.game-info-card p')
  const screenshotsGrid = document.querySelector('.screenshots-grid')

  const heroImage = image || game.image || FALLBACK
  const logoImage = game.logo || image || FALLBACK

  const selectedData = {
    ...game,
    screenshotSources: [heroImage, logoImage]
  }

  if (game.source === 'steam' && game.appid) {
    try {
      if (!window.kydraAPI?.getGameDetails) {
        setBackground(heroImage)
        showPage(pages.game)
        return
      }
      const details = await window.kydraAPI.getGameDetails(game.appid)

      if (details) {
        selectedData.description = selectedData.description
          || stripHTML(details.short_description)
          || stripHTML(details.detailed_description)

        selectedData.genre = selectedData.genre
          || details.genres?.map(g => g.description).join(' / ')

        selectedData.platforms = selectedData.platforms?.length
          ? selectedData.platforms
          : Object.entries(details.platforms || {})
            .filter(([, available]) => available)
            .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1))

        selectedData.release = selectedData.release || details.release_date?.date

        selectedData.screenshotSources = details.screenshots
          ?.map(s => s.path_full || s.path_thumbnail)
          .filter(Boolean)

        if (!selectedData.logo && details.header_image) {
          selectedData.logo = details.header_image
        }
      }
    } catch (error) {
      console.error('Failed to load Steam game details:', error)
    }
  }

  if (title) title.textContent = selectedData.name
  if (tag) tag.textContent = game.source === 'steam' ? 'Steam Deal' : 'itch.io Game'
  if (description) description.textContent = selectedData.description || 'No description available.'
  if (hero) hero.src = heroImage
  if (logo) logo.src = logoImage
  if (genre) genre.textContent = selectedData.genre || 'Indie'
  if (platforms) platforms.textContent = selectedData.platforms?.join(' / ') || 'Windows'
  if (release) release.textContent = selectedData.release || 'Unknown'

  if (price) {
    price.textContent = game.source === 'steam'
      ? formatPrice((game.price || 0) / 100, preferences.currency)
      : game.price
  }

  if (aboutText) {
    aboutText.textContent = selectedData.description || 'This game does not have a description available yet.'
  }

  if (screenshotsGrid) {
    screenshotsGrid.innerHTML = ''

    const screenshots = selectedData.screenshotSources.slice(0, 3).filter(Boolean)
    const screenshotItems = screenshots.length > 0
      ? screenshots
      : [heroImage, logoImage, FALLBACK]

    screenshotItems.forEach(src => {
      const img = document.createElement('img')
      img.src = src
      img.onerror = () => {
        img.src = FALLBACK
      }
      screenshotsGrid.appendChild(img)
    })
  }

  setBackground(heroImage)
  showPage(pages.game)
}

async function loadSteamDeals() {
  try {
    if (!window.kydraAPI?.getSteamDeals) return []
    const steamDeals = await window.kydraAPI.getSteamDeals() || []

    return steamDeals.map(g => ({
      ...g,
      source: 'steam',
      discount: typeof g.discount_percent === 'number' ? `${g.discount_percent}%` : g.discount || '0%',
      platforms: g.platforms || []
    }))
  } catch {
    return []
  }
}

function normalizeItch(game) {
  const rawPrice = parseFloat(
    String(game.price || '0').replace('$', '').replace(',', '.')
  )

  return {
    name: game.title || game.name,
    rawPrice,
    price: rawPrice <= 0
      ? 'FREE'
      : formatPrice(rawPrice, preferences.currency),
    discount: (game.discount || '0%').replace(/^-/, ''),
    image: game.image || FALLBACK,
    appid: null,
    url: game.url,
    source: 'itch',
    platforms: game.platforms || [],
    description: game.description || 'Amazing indie game available now.',
    genre: game.genre || 'Indie',
    release: game.release || '2026'
  }
}

async function loadItchDeals() {
  try {
    if (!window.kydraAPI?.getItchDeals) return []
    const res = await window.kydraAPI.getItchDeals()
    const games = res?.games || []
    return games.map(normalizeItch)
  } catch {
    return []
  }
}

async function loadLatestGames() {
  try {
    if (!window.kydraAPI?.getLatestGames) return []
    const res = await window.kydraAPI.getLatestGames()
    const games = res?.games || []
    return games.map(normalizeItch)
  } catch {
    return []
  }
}

function mergeDeals(itchDeals, steamDeals, limit = 20) {
  const merged = []
  const maxIndex = Math.max(itchDeals.length, steamDeals.length)

  for (let i = 0; i < maxIndex && merged.length < limit; i++) {
    if (i < itchDeals.length) merged.push(itchDeals[i])

    if (merged.length >= limit) break

    if (i < steamDeals.length) merged.push(steamDeals[i])
  }

  return merged
}

async function createCard(container, game, img) {
  const card = document.createElement('div')
  card.className = 'card'

  const platformsHTML = (game.platforms || [])
    .map(p => `<span class="platform-badge">${p}</span>`)
    .join('')

  const priceDisplay = game.source === 'steam'
    ? formatPrice((game.price || 0) / 100, preferences.currency)
    : game.price

  const sourceDisplay = game.source === 'steam' ? 'Steam' : 'itch.io'

  card.innerHTML = `
    <img src="${img}" onerror="this.src='${FALLBACK}'">
    <div class="card-content">
      <div class="card-title">${game.name}</div>
      <div class="card-price">${priceDisplay}</div>
      <small class="card-discount">${game.discount} OFF</small>
      <div class="card-platforms">${platformsHTML}</div>
      <div class="card-source">${sourceDisplay}</div>
    </div>
  `

  card.addEventListener('mouseenter', () => {
    setBackground(img)
  })

  card.addEventListener('click', () => {
    setGamePage(game, img)
  })

  container.appendChild(card)
}

async function loadDeals() {
  const dealsContainer = document.getElementById('deals')
  const latestContainer = document.getElementById('latest')

  if (!dealsContainer || !latestContainer) return

  dealsContainer.innerHTML = ''
  latestContainer.innerHTML = ''

  const [steamDeals, itchDeals, latestGames] = await Promise.all([
    preferences.steamDeals ? loadSteamDeals() : [],
    preferences.itchDeals ? loadItchDeals() : [],
    loadLatestGames()
  ])

  const deals = mergeDeals(itchDeals, steamDeals, 24)

  const assets = await Promise.all(
    deals.map(async g => {
      try {
        if (g.source !== 'steam' || !window.kydraAPI?.getAssets) return null
        return await window.kydraAPI.getAssets(g.appid)
      } catch {
        return null
      }
    })
  )

  if (deals[0]) {
    const heroImg = assets[0]?.header || deals[0].image || FALLBACK
    setHero(deals[0], heroImg)
    setBackground(heroImg)
  }

  await Promise.all(
    deals.map(async (game, i) => {
      const img = assets[i]?.header || game.image || FALLBACK
      await createCard(dealsContainer, game, img)
    })
  )

  await Promise.all(
    latestGames.map(game =>
      createCard(latestContainer, game, game.image || FALLBACK)
    )
  )
}

document.addEventListener('DOMContentLoaded', async () => {
  bg = document.querySelector('.bg')
  initializePageElements()
  await fetchExchangeRate()
  await loadPreferences()
  applyTheme()
  await getVersion()
  await checkForUpdates()

  const currencySetting = document.getElementById('currency-setting')
  if (currencySetting) {
    currencySetting.value = preferences.currency || 'USD'
    currencySetting.addEventListener('change', async e => {
      await setPreference('currency', e.target.value)
      await refreshUI()
    })
  }

  const themeSetting = document.getElementById('theme-setting')
  if (themeSetting) {
    themeSetting.value = preferences.theme || 'dark'
    themeSetting.addEventListener('change', async e => {
      await setPreference('theme', e.target.value)
      await refreshUI()
    })
  }

  const steamSetting = document.getElementById('steam-setting')
  if (steamSetting) {
    steamSetting.checked = preferences.steamDeals
    steamSetting.addEventListener('change', async e => {
      await setPreference('steamDeals', e.target.checked)
      await refreshUI()
    })
  }

  const itchSetting = document.getElementById('itch-setting')
  if (itchSetting) {
    itchSetting.checked = preferences.itchDeals
    itchSetting.addEventListener('change', async e => {
      await setPreference('itchDeals', e.target.checked)
      await refreshUI()
    })
  }

  await loadDeals()
})