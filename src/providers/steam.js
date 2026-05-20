require('dotenv').config()
const { exec } = require('child_process')

async function getGameDetails(appid) {
    try {
        const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}`)
        const data = await response.json()

        return data[appid]?.data || null

    } catch (error) {
        console.error(
            `Error fetching game details for AppID: ${appid}`,
            error
        )

        return null
    }
}

async function getSteamDeals() {
    try {

        const res = await fetch('https://store.steampowered.com/api/featuredcategories?cc=br&l=portuguese&currency=7')

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`)
        }

        const data = await res.json()

        return (data.specials?.items || [])
            .filter(g => g.discount_percent > 0)
            .map(g => ({
                name: g.name,
                appid: g.id,
                discount: g.discount_percent,

                price: g.final_price,

                image: g.large_capsule_image
            }))

    } catch (error) {
        console.error('Error fetching deals:', error)
        return []
    }
}

async function getSteamInstalledGames(path) {
    console.log('Fetching installed games...')
    return []
}

function getSteamAssets(appid) {
    const base = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}`

    const fallback = {
        header: '../../art/header.jpg'
    }

    const header = `${base}/header.jpg`

    return {
        header,
        hero: `${base}/library_hero.jpg`,
        cover: `${base}/library_600x900.jpg`,
        logo: `${base}/logo.png`,
        capsule: `${base}/capsule_616x353.jpg`,
        icon: `${base}/library_hero_blur.jpg`,
        fallback
    }
}

function validateGameFiles(appid) {
    exec(`start "" "steam://validate/${appid}"`, (error) => {
        if (error) {
            console.error(`Error validating game files for AppID: ${appid}`, error)
        } else {
            console.log(`Validation initiated for game with AppID: ${appid}`)
        }
    })
}

function installGame(appid) {
    exec(`start "" "steam://install/${appid}"`, (error) => {
        if (error) {
            console.error(`Error installing game with AppID: ${appid}`, error)
        } else {
            console.log(`Installation initiated for game with AppID: ${appid}`)
        }
    })
}

function uninstallGame(appid) {
    exec(`start "" "steam://uninstall/${appid}"`, (error) => {
        if (error) {
            console.error(`Error uninstalling game with AppID: ${appid}`, error)
        } else {
            console.log(`Uninstall initiated for game with AppID: ${appid}`)
        }
    })
}

function launchGame(appid) {
    exec(`start "" "steam://run/${appid}"`, (error) => {
        if (error) {
            console.error(
                `Error launching game with AppID: ${appid}`,
                error
            )
        } else {
            console.log(
                `Launched game with AppID: ${appid}`
            )
        }
    })
}

function openStorePage(appid) {
    exec(`start "" "steam://store/${appid}"`, (error) => {
        if (error) {
            console.error(`Error opening store page for AppID: ${appid}`, error)
        } else {
            console.log(`Opened store page for game with AppID: ${appid}`)
        }
    })
}

module.exports = {
    getGameDetails,
    getSteamDeals,
    getSteamInstalledGames,
    validateGameFiles,
    installGame,
    uninstallGame,
    launchGame,
    getSteamAssets,
    openStorePage
}