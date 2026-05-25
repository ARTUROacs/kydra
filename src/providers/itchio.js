async function getItchDeals() {
    try {
        console.log('[itchio] Fetching deals from http://localhost:3000/api/deals')
        const response = await fetch('http://localhost:3000/api/deals')
        
        if (!response.ok) {
            console.warn(`[itchio] HTTP error ${response.status}: deals endpoint unavailable`)
            return { success: false, games: [] }
        }
        
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('[itchio] Invalid content-type for deals:', contentType)
            return { success: false, games: [] }
        }
        
        const data = await response.json()

        if (!data || !data.success) {
            console.warn('[itchio] Invalid deals response structure')
            return { success: false, games: [] }
        }

        console.log('[itchio] Loaded', data.games?.length || 0, 'deals')
        return data
    } catch (err) {
        console.error('[itchio] Error fetching deals:', err.message)
        return { success: false, games: [] }
    }
}

async function getLatestGames() {
    try {
        console.log('[itchio] Fetching latest games from http://localhost:3000/api/latest')
        const response = await fetch('http://localhost:3000/api/latest')
        
        if (!response.ok) {
            console.warn(`[itchio] HTTP error ${response.status}: latest endpoint unavailable`)
            return { success: false, games: [] }
        }
        
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('[itchio] Invalid content-type for latest:', contentType)
            return { success: false, games: [] }
        }
        
        const data = await response.json()

        if (!data || !data.success) {
            console.warn('[itchio] Invalid latest games response structure')
            return { success: false, games: [] }
        }

        console.log('[itchio] Loaded', data.games?.length || 0, 'latest games')
        return data
    } catch (err) {
        console.error('[itchio] Error fetching latest games:', err.message)
        return { success: false, games: [] }
    }
}

module.exports = {
    getItchDeals,
    getLatestGames
}