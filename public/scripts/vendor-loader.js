(() => {
    const vendorScriptUrls = [
        "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js"
    ];

    const loadScript = (src) => new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[data-vendor-src="${src}"]`);
        if (existingScript) {
            if (existingScript.dataset.loaded === "true") {
                resolve();
                return;
            }

            existingScript.addEventListener("load", () => resolve(), { once: true });
            existingScript.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
            return;
        }

        const scriptTag = document.createElement("script");
        scriptTag.src = src;
        scriptTag.dataset.vendorSrc = src;
        scriptTag.addEventListener("load", () => {
            scriptTag.dataset.loaded = "true";
            resolve();
        }, { once: true });
        scriptTag.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
        document.head.appendChild(scriptTag);
    });

    window.AdanVendorScriptsReady = vendorScriptUrls.reduce(
        (promiseChain, currentSrc) => promiseChain.then(() => loadScript(currentSrc)),
        Promise.resolve()
    );
})();
