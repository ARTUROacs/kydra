const oauthurl = 'https://itch.io/user/oauth?client_id=1691af2d605bebe652f28062ac014e19&scope=profile:me&redirect_uri=https://github.com/eoansiedade/kydra&response_type=code'

function loginWithItchio() {
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const authWindow = window.open(
        oauthurl,
        'Itch.io Login',
        `width=${width},height=${height},top=${top},left=${left}`
    );
}

module.exports = {
    loginWithItchio 
};