const openid = require('openid')
const { URL } = require('url')
const http = require('http')

class SteamLoginService {

    constructor() {
        this.relyingParty = new openid.RelyingParty(
            'http://localhost:3000/steam/auth',
            null,
            true,
            false,
            []
        )
    }

    login() {
        return new Promise((resolve, reject) => {

            const authUrl = 'https://steamcommunity.com/openid/login'

            this.relyingParty.authenticate(
                authUrl,
                false,
                (error, authUrl) => {

                    if (error || !authUrl) {
                        return reject(error)
                    }

                    require('electron').shell.openExternal(authUrl)

                    const server = http.createServer(async (req, res) => {

                        const query =
                            new URL(req.url, 'http://localhost:3000')

                        if (query.pathname === '/steam/auth') {

                            const steamId =
                                this.extractSteamId(query.searchParams.get('openid.claimed_id'))

                            const user =
                                await this.getSteamUser(steamId)

                            res.end('Login successful! You can close this tab.')

                            server.close()

                            resolve(user)
                        }
                    })

                    server.listen(3000)
                }
            )
        })
    }

    extractSteamId(claimedId) {
        return claimedId.split('/').pop()
    }

    async getSteamUser(steamId) {

        const url =  `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_WEB_API}&steamids=${steamId}`

        const res = await fetch(url)
        const data = await res.json()

        const player =
            data.response.players[0]

        return {
            steamId: player.steamid,
            name: player.personaname,
            avatar: player.avatarfull,
            profile: player.profileurl
        }
    }
}

module.exports = new SteamLoginService()