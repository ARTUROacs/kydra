async function getOwnedItchioGames(accessToken) {
    console.log("Fetching owned Itch.io games...");
    try {
        const response = await fetch("https://itch.io/api/1/jwt/me",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        const profile = await response.json();

        console.log(profile);

        return profile;

    } catch (err) {

        console.error("Itch.io fetch failed:", err);

        return [];
    }
}

module.exports = {
    getOwnedItchioGames
};