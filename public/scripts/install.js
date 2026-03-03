document.addEventListener("DOMContentLoaded", () => {
    const markdownRoot = document.getElementById("install-markdown");

    if (!markdownRoot) {
        return;
    }

    const slugify = (text) => text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    const renderMarkdown = (markdownText) => {
        if (!window.marked || !window.DOMPurify) {
            markdownRoot.innerHTML = "<p>Markdown renderer is unavailable right now.</p>";
            return;
        }

        marked.setOptions({
            gfm: true,
            breaks: true
        });

        const unsafeHtml = marked.parse(markdownText.trim());
        const safeHtml = DOMPurify.sanitize(unsafeHtml);
        markdownRoot.innerHTML = safeHtml;

        markdownRoot.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
            if (!heading.id) {
                heading.id = slugify(heading.textContent);
            }
        });

        if (window.Prism) {
            Prism.highlightAllUnder(markdownRoot);
        }
    };

    const loadInstallContent = () => {
        fetch("./install.md")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load install markdown content");
                }
                return response.text();
            })
            .then((markdownText) => {
                renderMarkdown(markdownText);
            })
            .catch(() => {
                markdownRoot.innerHTML = "<p>Unable to load installation content right now.</p>";
            });
    };

    const vendorPromise = window.AdanVendorScriptsReady || Promise.resolve();
    vendorPromise
        .then(() => {
            loadInstallContent();
        })
        .catch(() => {
            markdownRoot.innerHTML = "<p>Unable to load required libraries right now.</p>";
        });
});
