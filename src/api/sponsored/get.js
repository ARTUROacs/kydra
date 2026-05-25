async function loadHero() {
  try {
    const response = await fetch(
      'https://jsonhosting.com/api/json/8efe1a5c/raw'
    )

    if (!response.ok) {
      console.error(`[sponsored api] HTTP error ${response.status}`)
      return null
    }

    let data = await response.json()

    if (typeof data === 'string') {
      data = JSON.parse(data)
    }

    if (!data || typeof data !== 'object') {
      console.error('[sponsored api] Invalid response format, got:', typeof data)
      return null
    }

    if (!data.name) {
      return null
    }

    const result = {
      name: data.name,
      description: data.description || '',
      url: data.url || data.link || '',
      appid: data.appid || data.id || '',
      price: data.price || data.originalPrice || 'FREE',
      discount: data.discount || data.discountPercent || '0%',
      platforms: Array.isArray(data.platforms) ? data.platforms : [],
      headerImage: data.headerImage || data.header || data.image || null,
      header: data.header || data.headerImage || data.image || null,
      image: data.image || data.headerImage || data.header || null,
      state: data.state || 'open'
    }

    return result

  } catch (err) {
    console.error('[sponsored api] Failed to load hero:', err)
    return null
  }
}

module.exports = {
    loadHero
};