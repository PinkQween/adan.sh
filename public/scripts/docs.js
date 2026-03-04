document.addEventListener("DOMContentLoaded", () => {
    const contentEl = document.getElementById("docs-content");
    const navLinks  = document.querySelectorAll(".docs-nav-link");

    if (!contentEl) return;

    const slugify = (text) => text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    const setActive = (link) => {
        navLinks.forEach((l) => l.classList.remove("is-active"));
        if (link) link.classList.add("is-active");
    };

    const renderMarkdown = (markdownText) => {
        if (!window.marked || !window.DOMPurify) {
            contentEl.innerHTML = "<p>Markdown renderer is unavailable right now.</p>";
            return;
        }

        marked.setOptions({ gfm: true, breaks: false });

        const unsafeHtml = marked.parse(markdownText.trim());
        const safeHtml   = DOMPurify.sanitize(unsafeHtml);
        contentEl.innerHTML = safeHtml;

        contentEl.querySelectorAll('a[href^="http://"], a[href^="https://"]').forEach((a) => {
            a.target = "_blank";
            a.rel    = "noopener noreferrer";
            a.classList.add("external-link");
        });

        contentEl.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
            if (!heading.id) heading.id = slugify(heading.textContent);
        });

        if (window.Prism) Prism.highlightAllUnder(contentEl);
        if (window.attachCopyButtons) window.attachCopyButtons(contentEl);
    };

    const loadDoc = (slug) => {
        const path = `/pages/docs/${slug}.md`;
        contentEl.innerHTML = "";

        return fetch(path)
            .then((r) => {
                if (!r.ok) throw new Error(`${r.status}`);
                return r.text();
            })
            .then((md) => renderMarkdown(md))
            .catch(() => {
                contentEl.innerHTML = "<p>Unable to load this section right now.</p>";
            });
    };

    // Resolve initial slug from hash or default to first nav link
    const initialSlug = (() => {
        const hash = window.location.hash.slice(1);
        if (hash && document.querySelector(`.docs-nav-link[data-doc="${hash}"]`)) return hash;
        return navLinks[0]?.dataset.doc || "types";
    })();

    navLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const slug = link.dataset.doc;
            history.pushState(null, "", `#${slug}`);
            setActive(link);
            const vendorReady = window.AdanVendorScriptsReady || Promise.resolve();
            vendorReady.then(() => loadDoc(slug));
        });
    });

    window.addEventListener("popstate", () => {
        const slug = window.location.hash.slice(1) || navLinks[0]?.dataset.doc || "types";
        const link = document.querySelector(`.docs-nav-link[data-doc="${slug}"]`);
        setActive(link);
        const vendorReady = window.AdanVendorScriptsReady || Promise.resolve();
        vendorReady.then(() => loadDoc(slug));
    });

    // Initial load
    const initLink = document.querySelector(`.docs-nav-link[data-doc="${initialSlug}"]`);
    setActive(initLink);

    const vendorPromise = window.AdanVendorScriptsReady || Promise.resolve();
    window.AdanPageReadyPromise = vendorPromise
        .then(() => loadDoc(initialSlug))
        .catch(() => {
            contentEl.innerHTML = "<p>Unable to load required libraries right now.</p>";
        });
});
