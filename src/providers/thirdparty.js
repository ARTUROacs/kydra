const fs = require('fs')
const path = require('path')

const preferences = require('../services/app')

async function searchSteamGame(query) {

    try {

        const response = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`)

        const data = await response.json()

        return data.items || []

    } catch (error) {

        console.error(`Error searching for game: ${query}`, error)

        return []
    }
}

async function downloadImage(url, output) {

    try {

        const res = await fetch(url)

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`)
        }

        const buffer = Buffer.from(await res.arrayBuffer())

        fs.writeFileSync(output, buffer)

        console.log(`Downloaded: ${output}`)

    } catch (error) {

        console.error(`Error downloading image: ${url}`, error)
    }
}

function getSteamAssets(appid) {

    const base =
        `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}`

    return {

        header:
            `${base}/header.jpg`,

        hero:
            `${base}/library_hero.jpg`,

        cover:
            `${base}/library_600x900.jpg`,

        capsule:
            `${base}/capsule_616x353.jpg`,

        logo:
            `${base}/logo.png`
    }
}

async function selectGame(gamePath, appid = null) {

    try {

        const gameDir = path.dirname(gamePath)

        const gameName = path.basename(gamePath, path.extname(gamePath))

        const kydraDir = path.join(gameDir, '.kydra')

        const imagesDir = path.join(kydraDir, 'images')

        if (!fs.existsSync(kydraDir)) {
            fs.mkdirSync(kydraDir)
        }

        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir)
        }

        const metadataPath = path.join(kydraDir, 'metadata.json')

        const metadata = {

            name: gameName,

            executable: gamePath,

            appid: appid || "",

            addedAt: new Date().toISOString(),

            images: {

                header: "",
                hero: "",
                cover: "",
                capsule: "",
                logo: ""
            }
        }

        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

        console.log(`.kydra created for ${gameName}`)

        if (appid) {

            const assets =
                getSteamAssets(appid)

            const downloads = [

                {
                    url: assets.header,
                    file: 'header.jpg'
                },

                {
                    url: assets.hero,
                    file: 'hero.jpg'
                },

                {
                    url: assets.cover,
                    file: 'cover.jpg'
                },

                {
                    url: assets.capsule,
                    file: 'capsule.jpg'
                },

                {
                    url: assets.logo,
                    file: 'logo.png'
                }
            ]

            for (const item of downloads) {

                const output = path.join(imagesDir, item.file)

                await downloadImage(
                    item.url,
                    output
                )
            }
        }

        return {

            success: true,

            game: {

                name: gameName,
                executable: gamePath,
                appid
            },

            paths: {

                root: kydraDir,
                images: imagesDir,
                metadata: metadataPath
            }
        }

    } catch (error) {

        console.error('Error selecting game:', error)

        return {
            success: false,
            error: error.message
        }
    }
}

function getGameImages(gamePath) {

    try {

        const gameDir = path.dirname(gamePath)

        const kydraDir = path.join(gameDir, '.kydra')

        const metadataPath = path.join(kydraDir, 'metadata.json')

        if (!fs.existsSync(metadataPath)) {
            return null
        }

        const metadata = JSON.parse(fs.readFileSync(metadataPath))

        const imagesDir = path.join(kydraDir, 'images')

        function resolveImage(localFile, customValue) {

            if (customValue && customValue !== "") {
                return customValue
            }

            return path.join(imagesDir, localFile)
        }

        return {

            header:
                resolveImage('header.jpg', metadata.images.header),

            hero:
                resolveImage('hero.jpg', metadata.images.hero),

            cover:
                resolveImage('cover.jpg', metadata.images.cover),

            capsule:
                resolveImage('capsule.jpg', metadata.images.capsule),

            logo:
                resolveImage('logo.png', metadata.images.logo)
        }

    } catch (error) {

        console.error(
            'Error loading game images:',
            error
        )

        return null
    }
}

function getDirs(dir, result = []) {
    const files = fs.readdirSync(dir)

    files.forEach(file => {
        const fullPath = path.join(dir, file)

        if (fs.statSync(fullPath).isDirectory()) {
            result.push(fullPath)
            getDirs(fullPath, result)
        }
    })

    return result
}

async function getInstalledGames() {
    const steamDir = preferences.getPreference('steamGameDir')
    const itchioDir = preferences.getPreference('itchioGameDir')
    const thirdpartyDir = preferences.getPreference('thirdpartyGameDir')

    const games = []

    function loadGame(dir, source) {
        const kydraPath = path.join(dir, '.kydra')
        const metaPath = path.join(kydraPath, 'meta.json')

        if (!fs.existsSync(kydraPath)) return
        if (!fs.existsSync(metaPath)) return

        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))

        const artsPath = path.join(dir, 'arts')

        const header = path.join(artsPath, meta.header || 'header.png')
        const bg = path.join(artsPath, meta.bg || 'bg.png')
        const logo = path.join(artsPath, meta.logo || 'logo.png')

        meta.source = source

        games.push({
            type: source,

            path: dir,

            meta,

            arts: {
                header: fs.existsSync(header) ? header : null,
                bg: fs.existsSync(bg) ? bg : null,
                logo: fs.existsSync(logo) ? logo : null
            }
        })
    }

    if (steamDir) {
        const dirs = getDirs(steamDir)

        dirs.forEach(dir => {
            loadGame(dir, 'steam')
        })
    } else {
        console.warn('Steam game directory not set in preferences.')
    }

    if (itchioDir) {
        const dirs = getDirs(itchioDir)

        dirs.forEach(dir => {
            loadGame(dir, 'itchio')
        })
    } else {
        console.warn('Itchio game directory not set in preferences.')
    }

    if (thirdpartyDir) {
        const dirs = getDirs(thirdpartyDir)

        dirs.forEach(dir => {
            loadGame(dir, 'thirdparty')
        })
    } else {
        console.warn('Third-party game directory not set in preferences.')
    }

    return games
}

module.exports = {
    searchSteamGame,
    selectGame,
    getInstalledGames,
    getGameImages
}