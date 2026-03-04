// Horrible loading thing
// Basically I jsut want to hide content until the page is fully loaded
// To make things feel like seamless

(() => {
    const MIN_LOADER_MS = 300;
    const loaderStartTime = Date.now();

    const root = document.documentElement;
    root.classList.add("adan-loading-active");

    const styleTag = document.createElement("style");
    styleTag.textContent = `
html.adan-loading-active body > *:not(#adan-global-loader) {
    opacity: 0 !important;
    visibility: hidden !important;
}

#adan-global-loader {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0d0d0d;
    z-index: 9999;
    opacity: 1;
    transition: opacity 220ms ease;
}

#adan-global-loader.is-done {
    opacity: 0;
    pointer-events: none;
}

#adan-global-loader img {
    width: 96px;
    height: 96px;
    animation: adan-loader-pulse 1.15s ease-in-out infinite;
}

@keyframes adan-loader-pulse {
    0%, 100% {
        transform: scale(0.86);
        opacity: 0.78;
    }
    50% {
        transform: scale(1.14);
        opacity: 1;
    }
}
`;
    document.head.appendChild(styleTag);

    const resolveLogoSrc = () => {
        if (document.currentScript && document.currentScript.src) {
            return new URL("../assets/logo.png", document.currentScript.src).href;
        }
        return "/assets/logo.png";
    };

    const ensureLoader = () => {
        if (!document.body || document.getElementById("adan-global-loader")) {
            return;
        }

        const loader = document.createElement("div");
        loader.id = "adan-global-loader";

        const logo = document.createElement("img");
        logo.src = resolveLogoSrc();
        logo.alt = "ADAN loading";

        loader.appendChild(logo);
        document.body.appendChild(loader);
    };

    const hideLoader = () => {
        ensureLoader();

        const loader = document.getElementById("adan-global-loader");
        if (loader) {
            loader.classList.add("is-done");
            setTimeout(() => {
                loader.remove();
            }, 240);
        }

        root.classList.remove("adan-loading-active");
    };

    const waitUntilReady = () => Promise
        .resolve(window.AdanPageReadyPromise)
        .catch(() => undefined)
        .then(() => undefined);

    const waitForLoader = () => {
        const elapsed = Date.now() - loaderStartTime;
        const remaining = Math.max(0, MIN_LOADER_MS - elapsed);
        return new Promise((resolve) => setTimeout(resolve, remaining));
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ensureLoader, { once: true });
    } else {
        ensureLoader();
    }

    window.addEventListener("load", () => {
        Promise.all([waitUntilReady(), waitForLoader()]).then(hideLoader);
    }, { once: true });
})();
