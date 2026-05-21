async function getItchDeals() {
    try {
        const response = await fetch('http://localhost:3000/api/deals')
        const data = await response.json()

        if (!data || !data.success) {
            throw new Error('Failed to fetch Itch.io deals')
        }

        return data
    } catch (err) {
        console.error('Error fetching Itch.io deals:', err)
        return { success: false, games: [] }
    }
}

module.exports = {
    getItchDeals
}