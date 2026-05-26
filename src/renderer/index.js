const FALLBACK = "../../art/header.png";
const FALLBACKBG = "../../art/bg.png";

let bg = null;
let selectedGame = null;

const preferences = {
  theme: "dark",
  itchDeals: true,
  steamDeals: false,
  steamGameDir: "",
  itchioGameDir: "",
  thirdpartyGameDir: "",
  language: "en",
  currency: "USD",
  notifications: true,
};

let USD_TO_BRL = 5.01;
let currentVersion = null;
let currentLanguage = "pt";

async function systemNotification(
  title,
  body,
  icon = "../../art/icon_nobg.png",
) {
  try {
    if (!("Notification" in window)) {
      return;
    }

    let permission = Notification.permission;

    if (permission !== "granted") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      return;
    }

    const notif = new Notification(title, {
      body,
      icon,
      silent: false,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return notif;
  } catch (err) {
    console.error("Failed:", err);
  }
}

const thirdparty = {
  async getInstalledGames() {
    if (!window.kydraAPI?.getInstalledGames) return [];
    const games = await window.kydraAPI.getInstalledGames();
    return games.filter((g) => g.type === "thirdparty");
  },
};

async function loadLibrary() {
  const grid = document.querySelector(".library-grid");
  if (!grid) return;

  grid.innerHTML = "";

  const games = await thirdparty.getInstalledGames();

  games.forEach((game) => {
    const meta = game.meta || {};
    const img = game.arts?.header || FALLBACK;

    const card = document.createElement("div");
    card.className = "library-card";

    card.innerHTML = `
      <img src="${img}" class="library-thumb">
      <div class="library-card-content">
        <span class="library-status installed">Installed</span>
        <h2>${meta.title || "Unknown"}</h2>
        <p>${meta.description || ""}</p>
      </div>
    `;

    card.onclick = () => {
      setGamePage(
        {
          name: meta.title,
          description: meta.description,
          source: "thirdparty",
          image: img,
          ...meta,
        },
        img,
      );
    };

    grid.appendChild(card);
  });
}

let translations = {
  pt: {},
  en: {},
};

async function fetchExchangeRate() {
  try {
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
    );
    const data = await response.json();
    USD_TO_BRL = data?.rates?.BRL || 5.01;
  } catch {
    USD_TO_BRL = 5.01;
  }
}

async function loadPreferences() {
  try {
    if (window.kydraAPI?.loadPreferences) {
      const prefs = await window.kydraAPI.loadPreferences();
      if (prefs && typeof prefs === "object") {
        preferences = { ...preferences, ...prefs };
        console.log("[preferences] Loaded:", preferences);
      }
    }
  } catch (err) {
    console.error("[preferences] Failed to load:", err);
  }
}

async function setPreference(key, value) {
  try {
    preferences[key] = value;
    if (window.kydraAPI?.setPreference) {
      const result = await window.kydraAPI.setPreference(key, value);
      console.log(`[preferences] Set ${key}:`, value, "Result:", result);
      return result;
    }
  } catch (err) {
    console.error(`[preferences] Failed to set ${key}:`, err);
    throw err;
  }
}

function convertUSDToBRL(value) {
  return value * USD_TO_BRL;
}

function formatPrice(value, currency = "USD") {
  if (value === null || value === undefined) return "FREE";

  let numeric = 0;
  if (typeof value === "string") {
    numeric = parseFloat(value.replace("$", "").replace(",", "."));
  } else if (typeof value === "number") {
    numeric = value;
  } else {
    return "FREE";
  }

  if (isNaN(numeric) || !isFinite(numeric)) return "FREE";
  if (numeric <= 0) return "FREE";

  try {
    if (currency === "BRL") {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(convertUSDToBRL(numeric));
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numeric);
  } catch (err) {
    console.warn("[formatPrice] Error formatting:", value, err);
    return "FREE";
  }
}

function applyTheme() {
  document.body.setAttribute("data-theme", preferences.theme || "dark");
}

async function refreshUI() {
  await loadPreferences();
  applyTheme();
  await loadDeals();

  if (selectedGame) {
    await setGamePage(selectedGame, selectedGame.image);
  }
}

async function loadTranslations(language = currentLanguage) {
  try {
    const langCode =
      language === "pt-BR" ? "pt" : language === "en-US" ? "en" : language;
    if (window.kydraAPI?.getAllTranslations) {
      const loaded = await window.kydraAPI.getAllTranslations(langCode);
      if (loaded && typeof loaded === "object") {
        translations[langCode] = { ...translations[langCode], ...loaded };
        console.log(
          `[translations] Loaded ${langCode}:`,
          Object.keys(loaded).length,
          "keys",
        );
      }
    }
    currentLanguage = langCode;
  } catch (err) {
    console.error(`[translations] Failed to load ${language}:`, err);
  }
}

function t(key, variables = {}) {
  const keys = key.split(".");
  let value = translations[currentLanguage] || translations["pt"];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }

  if (!value || typeof value !== "string") return key;

  if (Object.keys(variables).length > 0) {
    return value.replace(
      /\{(\w+)\}/g,
      (match, varKey) => variables[varKey] || match,
    );
  }

  return value;
}

async function setLanguage(language) {
  const langCode =
    language === "pt-BR" ? "pt" : language === "en-US" ? "en" : language;
  currentLanguage = langCode;
  await loadTranslations(langCode);
  await setPreference("language", langCode);

  const sidebarSpans = document.querySelectorAll(".sidebar-btn span");
  const sectionTitles = document.querySelectorAll(".section-title");
  const heroTag = document.querySelector(".hero-tag");
  const heroBtns = document.querySelectorAll(".hero-btn");

  if (sidebarSpans[0]) sidebarSpans[0].textContent = t("navigation.home");
  if (sidebarSpans[1]) sidebarSpans[1].textContent = t("navigation.library");
  if (sidebarSpans[2]) sidebarSpans[2].textContent = t("navigation.settings");

  if (sectionTitles[0]) sectionTitles[0].textContent = t("section.deals");
  if (sectionTitles[1]) sectionTitles[1].textContent = t("section.latest");

  if (heroTag) heroTag.textContent = t("hero.featured");
  if (heroBtns[0]) heroBtns[0].textContent = t("hero.playNow");
  if (heroBtns[1]) heroBtns[1].textContent = t("hero.viewStore");

  await refreshUI();
}

function setBackground(url) {
  if (!bg) return;

  bg.style.backgroundImage = `url(${url})`;

  const test = new Image();
  test.onerror = () => {
    bg.style.backgroundImage = `url(${FALLBACKBG})`;
  };
  test.src = url;
}

function stripHTML(text) {
  return text?.replace(/<[^>]*>/g, "").trim() || "";
}

function parseVersion(versionString) {
  const match = versionString.match(/(\d+)\.(\d+)\.(\d+)([a-z])?/i);
  if (!match) return null;
  return {
    year: parseInt(match[1]),
    month: parseInt(match[2]),
    day: parseInt(match[3]),
    suffix: match[4] || "",
    original: versionString,
  };
}

function compareVersions(v1, v2) {
  const p1 = parseVersion(v1);
  const p2 = parseVersion(v2);
  if (!p1 || !p2) return 0;
  if (p1.year !== p2.year) return p1.year - p2.year;
  if (p1.month !== p2.month) return p1.month - p2.month;
  if (p1.day !== p2.day) return p1.day - p2.day;
  return p1.suffix.localeCompare(p2.suffix);
}

function showUpdateNotification(newVersion) {
  const existing = document.getElementById("update-notification");

  if (existing) existing.remove();

  const notif = document.createElement("div");

  notif.id = "update-notification";
  notif.className = "update-notif";

  notif.innerHTML = `
    <div class="notif-title">Update Available!</div>

    <div class="notif-text">
      Version ${newVersion} is ready
    </div>

    <button id="update-btn">
      Update Now
    </button>
  `;

  document.body.appendChild(notif);

  const updateBtn = document.getElementById("update-btn");

  updateBtn.addEventListener("click", () => {
    window.open("https://github.com/k7sistemas/kydra/releases", "_blank");
  });

  systemNotification(
    "Kydra",
    "Version " + newVersion + " is ready to install. Click to update.",
  );

  setTimeout(() => {
    if (notif.parentNode) {
      notif.remove();
    }
  }, 10000);
}

async function getVersion() {
  const footer = document.querySelector(".footer-text");
  const versionElement = document.getElementById("app-version");

  if (!footer) return;

  try {
    const version = window.kydraAPI?.getVersion
      ? await window.kydraAPI.getVersion()
      : "Unknown Version";
    currentVersion = version;
    footer.textContent = version;
    if (versionElement) versionElement.textContent = version;
  } catch {
    footer.textContent = "Unknown Version";
    if (versionElement) versionElement.textContent = "Unknown Version";
  }
}

async function checkForUpdates() {
  if (!currentVersion || currentVersion === "Unknown Version") return;
  try {
    if (window.kydraAPI?.checkUpdates) {
      const latestVersion = await window.kydraAPI.checkUpdates();
      if (latestVersion && compareVersions(latestVersion, currentVersion) > 0) {
        showUpdateNotification(latestVersion);
      }
    }
  } catch (err) {
    console.error("Failed to check for updates:", err);
  }
}

let sidebarButtons = null;
let pages = null;

function initializePageElements() {
  if (sidebarButtons) return;
  sidebarButtons = document.querySelectorAll(".sidebar-btn");
  pages = {
    home: document.querySelector(".page-home"),
    game: document.querySelector(".page-game"),
    library: document.querySelector(".page-library"),
    settings: document.querySelector(".page-settings"),
  };
  sidebarButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      sidebarButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.querySelector("span")?.textContent?.toLowerCase();

      if (target === "home") showPage(pages.home);
      if (target === "library") showPage(pages.library);
      if (target === "settings") showPage(pages.settings);
    });
  });
}

function showPage(pageToShow) {
  if (!pages) return;

  Object.values(pages).forEach((page) => {
    if (!page) return;

    if (page === pageToShow) {
      page.classList.remove("hidden");
      page.style.display = "block";
      page.style.position = "relative";

      requestAnimationFrame(() => {
        page.style.opacity = "1";
        page.style.transform = "translateY(0px)";
      });
    } else {
      page.style.opacity = "0";
      page.style.transform = "translateY(10px)";

      setTimeout(() => {
        page.classList.add("hidden");
        page.style.display = "none";
      }, 250);
    }
  });
}

function setHero(game, image) {
  const heroBanner = document.querySelector(".hero-banner");
  const heroTitle = document.querySelector(".hero-title");
  const heroDescription = document.querySelector(".hero-description");
  const primaryBtn = document.querySelector(".hero-btn.primary");
  const secondaryBtn = document.querySelector(".hero-btn.secondary");

  if (!heroBanner || !heroTitle) return;

  heroBanner.src = image || FALLBACK;
  heroBanner.onerror = () => {
    heroBanner.src = FALLBACK;
  };

  heroTitle.textContent = game.name;

  if (game.source === "sponsored") {
    heroDescription.textContent =
      game.description || t("hero.featuredSponsored");
  } else if (game.source === "steam") {
    heroDescription.textContent = `Enjoy ${game.discount} off on Steam!`;
  } else {
    heroDescription.textContent =
      "Featured indie game on itch.io with a promotion available now.";
  }

  const openGame = () => {
    if (game.source === "steam") {
      if (window.kydraAPI?.openStorePage) {
        window.kydraAPI.openStorePage(game.appid);
      } else {
        window.open(
          `https://store.steampowered.com/app/${game.appid}`,
          "_blank",
        );
      }
    } else {
      window.open(game.url, "_blank");
    }
  };

  const addToWishlist = () => {
    console.log("[hero] Added to wishlist:", game.name);
    window.open(game.url, "_blank");
  };

  if (game.source === "sponsored" && game.state === "wishlist") {
    primaryBtn.textContent = t("button.wishlist");
    primaryBtn.onclick = addToWishlist;
    secondaryBtn.textContent = t("hero.viewStore");
    secondaryBtn.onclick = openGame;
  } else {
    primaryBtn.textContent =
      game.source === "sponsored" ? t("hero.playNow") : t("hero.playNow");
    primaryBtn.onclick = openGame;
    secondaryBtn.textContent = t("button.wishlist");
    secondaryBtn.onclick = addToWishlist;
  }
}

async function setGamePage(game, image) {
  selectedGame = game;

  const title = document.querySelector(".game-title");
  const tag = document.querySelector(".game-tag");
  const description = document.querySelector(".game-description");
  const hero = document.querySelector(".game-hero-bg");
  const logo = document.querySelector(".game-logo");
  const genre = document.querySelector(".game-genre");
  const platforms = document.querySelector(".game-platforms");
  const price = document.querySelector(".game-price");
  const release = document.querySelector(".game-release");
  const aboutText = document.querySelector(".game-info-card p");
  const screenshotsGrid = document.querySelector(".screenshots-grid");
  const buyBtn = document.querySelector(".buy-btn");

  const heroImage = image || game.image || FALLBACK;
  const logoImage = game.logo || image || FALLBACK;

  const selectedData = {
    ...game,
    screenshotSources: [heroImage, logoImage],
  };

  if (game.source === "steam" && game.appid) {
    try {
      if (!window.kydraAPI?.getGameDetails) {
        setBackground(heroImage);
        showPage(pages.game);
        return;
      }
      const details = await window.kydraAPI.getGameDetails(game.appid);

      if (details) {
        selectedData.description =
          selectedData.description ||
          stripHTML(details.short_description) ||
          stripHTML(details.detailed_description);

        selectedData.genre =
          selectedData.genre ||
          details.genres?.map((g) => g.description).join(" / ");

        selectedData.platforms = selectedData.platforms?.length
          ? selectedData.platforms
          : Object.entries(details.platforms || {})
              .filter(([, available]) => available)
              .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));

        selectedData.release =
          selectedData.release || details.release_date?.date;

        selectedData.screenshotSources = details.screenshots
          ?.map((s) => s.path_full || s.path_thumbnail)
          .filter(Boolean);

        if (!selectedData.logo && details.header_image) {
          selectedData.logo = details.header_image;
        }
      }
    } catch (error) {
      console.error("Failed to load Steam game details:", error);
    }
  }

  if (title) title.textContent = selectedData.name;
  if (tag)
    tag.textContent = game.source === "steam" ? "Steam Deal" : "itch.io Game";
  if (description)
    description.textContent =
      selectedData.description || "No description available.";
  if (hero) hero.src = heroImage;
  if (logo) logo.src = logoImage;
  if (genre) genre.textContent = selectedData.genre || "Indie";
  if (platforms)
    platforms.textContent = selectedData.platforms?.join(" / ") || "Windows";
  if (release) release.textContent = selectedData.release || "Unknown";

  if (price) {
    let priceValue = "FREE";
    if (game.source === "steam") {
      const steamPrice = parseInt(game.price) || 0;
      priceValue = formatPrice(steamPrice / 100, preferences.currency);
    } else if (game.price) {
      priceValue = formatPrice(game.price, preferences.currency);
    }
    price.textContent = priceValue;
  }

  if (aboutText) {
    aboutText.textContent =
      selectedData.description ||
      "This game does not have a description available yet.";
  }

  if (screenshotsGrid) {
    screenshotsGrid.innerHTML = "";

    const screenshots = selectedData.screenshotSources
      .slice(0, 3)
      .filter(Boolean);
    const screenshotItems =
      screenshots.length > 0 ? screenshots : [heroImage, logoImage, FALLBACK];

    screenshotItems.forEach((src) => {
      const img = document.createElement("img");
      img.src = src;
      img.onerror = () => {
        img.src = FALLBACK;
      };
      screenshotsGrid.appendChild(img);
    });
  }

  if (buyBtn) {
    if (game.source === "itch") {
      buyBtn.onclick = null;

      setTimeout(() => {
        if (window.Itch?.attachBuyButton) {
          Itch.attachBuyButton(buyBtn, {
            user: game.author || game.user,
            game: game.slug || game.name,
          });
        } else {
          console.warn("Itch API not loaded");
        }
      }, 0);
    } else {
      buyBtn.onclick = () => {
        if (game.source === "steam") {
          if (window.kydraAPI?.openStorePage) {
            window.kydraAPI.openStorePage(game.appid);
          } else {
            window.open(
              `https://store.steampowered.com/app/${game.appid}`,
              "_blank",
            );
          }
        } else {
          window.open(game.url, "_blank");
        }
      };
    }
  }

  setBackground(heroImage);
  showPage(pages.game);
}

async function loadSteamDeals() {
  try {
    if (!window.kydraAPI?.getSteamDeals) return [];
    const steamDeals = (await window.kydraAPI.getSteamDeals()) || [];
    return steamDeals.map((g) => ({
      ...g,
      source: "steam",
      discount:
        typeof g.discount_percent === "number"
          ? `${g.discount_percent}%`
          : g.discount || "0%",
      platforms: g.platforms || [],
    }));
  } catch {
    return [];
  }
}

function normalizeItch(game) {
  const rawPrice = parseFloat(
    String(game.price || "0")
      .replace("$", "")
      .replace(",", "."),
  );
  return {
    name: game.title || game.name,
    rawPrice,
    price: rawPrice <= 0 ? "FREE" : rawPrice,
    discount: (game.discount || "0%").replace(/^-/, ""),
    image: game.image || FALLBACK,
    appid: null,
    url: game.url,
    source: "itch",
    platforms: game.platforms || [],
    description: game.description || "Amazing indie game available now.",
    genre: game.genre || "Indie",
    release: game.release || "2026",
  };
}

async function loadItchDeals() {
  try {
    if (!window.kydraAPI?.getItchDeals) return [];
    const res = await window.kydraAPI.getItchDeals();
    const games = res?.games || [];
    return games.map(normalizeItch);
  } catch {
    return [];
  }
}

async function loadLatestGames() {
  try {
    if (!window.kydraAPI?.getItchLatestGames) return [];
    const res = await window.kydraAPI.getItchLatestGames();
    const games = res?.games || [];
    return games.map(normalizeItch);
  } catch {
    return [];
  }
}

function mergeDeals(itchDeals, steamDeals, limit = 20) {
  const merged = [];
  const maxIndex = Math.max(itchDeals.length, steamDeals.length);

  for (let i = 0; i < maxIndex && merged.length < limit; i++) {
    if (i < itchDeals.length) merged.push(itchDeals[i]);

    if (merged.length >= limit) break;

    if (i < steamDeals.length) merged.push(steamDeals[i]);
  }

  return merged;
}

function createCard(container, game, img) {
  const card = document.createElement("div");
  card.className = "card";

  const platformsHTML = (game.platforms || [])
    .map((p) => `<span class="platform-badge">${p}</span>`)
    .join("");

  let priceDisplay = "FREE";
  if (game.source === "steam") {
    const steamPrice = parseInt(game.price) || 0;
    priceDisplay = formatPrice(steamPrice / 100, preferences.currency);
  } else if (game.price) {
    priceDisplay = formatPrice(game.price, preferences.currency);
  }

  const sourceDisplay = game.source === "steam" ? "Steam" : "itch.io";

  card.innerHTML = `
    <img src="${img}" onerror="this.src='${FALLBACK}'">
    <div class="card-content">
      <div class="card-title">${game.name}</div>
      <div class="card-price">${priceDisplay}</div>
      <small class="card-discount">${game.discount} OFF</small>
      <div class="card-platforms">${platformsHTML}</div>
      <div class="card-source">${sourceDisplay}</div>
    </div>
  `;

  card.addEventListener("mouseenter", () => {
    setBackground(img);
  });

  card.addEventListener("click", () => {
    setGamePage(game, img);
  });

  container.appendChild(card);
}

async function loadDeals() {
  const dealsContainer = document.getElementById("deals");
  const latestContainer = document.getElementById("latest");

  if (!dealsContainer || !latestContainer) return;

  dealsContainer.innerHTML = "";
  latestContainer.innerHTML = "";

  const heroTitle = document.querySelector(".hero-title");
  const heroDesc = document.querySelector(".hero-description");
  if (heroTitle) heroTitle.textContent = t("app.loading");
  if (heroDesc) heroDesc.textContent = t("app.fetchingDeals");

  let sponsoredHero = null;
  let sponsoredImage = null;

  try {
    sponsoredHero = await window.kydraAPI?.getSponsoredHero?.();
    if (sponsoredHero && sponsoredHero.name) {
      sponsoredImage =
        sponsoredHero.headerImage ||
        sponsoredHero.header ||
        sponsoredHero.image ||
        FALLBACK;
      console.log("[sponsored] Valid hero data, name:", sponsoredHero.name);
    }
  } catch (err) {
    console.error("[sponsored] Failed to load sponsored hero:", err);
  }

  const [steamDeals, itchDeals, latestGames] = await Promise.all([
    preferences.steamDeals ? loadSteamDeals() : [],
    preferences.itchDeals ? loadItchDeals() : [],
    loadLatestGames(),
  ]);

  const deals = mergeDeals(itchDeals, steamDeals, 24);

  let heroGame = null;
  let heroImage = FALLBACK;

  if (sponsoredHero && sponsoredHero.name) {
    heroGame = {
      name: sponsoredHero.name || "Sponsored Game",
      description: sponsoredHero.description || "",
      url: sponsoredHero.url || "",
      appid: sponsoredHero.appid || "",
      price: sponsoredHero.price || "FREE",
      discount: sponsoredHero.discount || "0%",
      platforms: Array.isArray(sponsoredHero.platforms)
        ? sponsoredHero.platforms
        : [],
      image: sponsoredImage,
      source: "sponsored",
      state: sponsoredHero.state || "open",
    };
    heroImage = sponsoredImage;
    console.log(
      "[sponsored] Setting hero to sponsored game:",
      heroGame.name,
      "State:",
      heroGame.state,
    );
  } else if (deals.length > 0) {
    const assets = await Promise.all(
      deals.map(async (game) => {
        try {
          if (game.source !== "steam" || !window.kydraAPI?.getAssets)
            return null;
          return await window.kydraAPI.getAssets(game.appid);
        } catch {
          return null;
        }
      }),
    );
    heroGame = deals[0];
    heroImage = assets[0]?.header || deals[0].image || FALLBACK;
    console.log("[deals] Setting hero to first deal:", heroGame.name);
  }

  if (heroGame) {
    setHero(heroGame, heroImage);
    setBackground(heroImage);
  }

  deals.forEach((game) => {
    createCard(dealsContainer, game, game.image || FALLBACK);
  });

  latestGames.forEach((game) => {
    createCard(latestContainer, game, game.image || FALLBACK);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  bg = document.querySelector(".bg");
  initializePageElements();
  await loadLibrary();
  await fetchExchangeRate();
  await loadPreferences();
  currentLanguage = preferences.language || "pt";
  await loadTranslations(currentLanguage);
  applyTheme();
  await getVersion();
  await checkForUpdates();

  const sidebarSpans = document.querySelectorAll(".sidebar-btn span");
  const sectionTitles = document.querySelectorAll(".section-title");
  const heroTag = document.querySelector(".hero-tag");
  const heroBtns = document.querySelectorAll(".hero-btn");

  if (sidebarSpans[0]) sidebarSpans[0].textContent = t("navigation.home");
  if (sidebarSpans[1]) sidebarSpans[1].textContent = t("navigation.library");
  if (sidebarSpans[2]) sidebarSpans[2].textContent = t("navigation.settings");

  if (sectionTitles[0]) sectionTitles[0].textContent = t("section.deals");
  if (sectionTitles[1]) sectionTitles[1].textContent = t("section.latest");

  if (heroTag) heroTag.textContent = t("hero.featured");
  if (heroBtns[0]) heroBtns[0].textContent = t("hero.playNow");
  if (heroBtns[1]) heroBtns[1].textContent = t("hero.viewStore");

  const steamDir = document.getElementById("steam-dir-setting");
  if (steamDir) {
    steamDir.value = preferences.steamGameDir || "";
    steamDir.addEventListener("change", async (e) => {
      await setPreference("steamGameDir", e.target.value);
    });
  }

  const itchDir = document.getElementById("itch-dir-setting");
  if (itchDir) {
    itchDir.value = preferences.itchioGameDir || "";
    itchDir.addEventListener("change", async (e) => {
      await setPreference("itchioGameDir", e.target.value);
    });
  }

  const thirdDir = document.getElementById("third-party-dir-setting");
  if (thirdDir) {
    thirdDir.value = preferences.thirdpartyGameDir || "";
    thirdDir.addEventListener("change", async (e) => {
      await setPreference("thirdpartyGameDir", e.target.value);
    });
  }

  const currencySetting = document.getElementById("currency-setting");
  if (currencySetting) {
    currencySetting.value = preferences.currency || "USD";
    currencySetting.addEventListener("change", async (e) => {
      await setPreference("currency", e.target.value);
      await refreshUI();
    });
  }

  const themeSetting = document.getElementById("theme-setting");
  if (themeSetting) {
    themeSetting.value = preferences.theme || "dark";
    themeSetting.addEventListener("change", async (e) => {
      await setPreference("theme", e.target.value);
      await refreshUI();
    });
  }

  const languageSetting = document.getElementById("language-setting");
  if (languageSetting) {
    languageSetting.value = preferences.language === "pt" ? "pt-BR" : "en-US";
    languageSetting.addEventListener("change", async (e) => {
      const lang = e.target.value === "pt-BR" ? "pt" : "en";
      await setLanguage(lang);
    });
  }

  const steamSetting = document.getElementById("steam-setting");
  if (steamSetting) {
    steamSetting.checked = preferences.steamDeals;
    steamSetting.addEventListener("change", async (e) => {
      await setPreference("steamDeals", e.target.checked);
      await refreshUI();
    });
  }

  const itchSetting = document.getElementById("itch-setting");
  if (itchSetting) {
    itchSetting.checked = preferences.itchDeals;
    itchSetting.addEventListener("change", async (e) => {
      await setPreference("itchDeals", e.target.checked);
      await refreshUI();
    });
  }

  const notificationsSetting = document.getElementById("notifications-setting");
  if (notificationsSetting) {
    notificationsSetting.checked = preferences.notifications;
    notificationsSetting.addEventListener("change", async (e) => {
      await setPreference("notifications", e.target.checked);
    });
  }

  await loadDeals();
});
