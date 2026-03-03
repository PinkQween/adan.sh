document.addEventListener("DOMContentLoaded", () => {
    const markdownRoot = document.getElementById("install-markdown");
    const tocListRoot = document.getElementById("install-toc-list");

    if (!markdownRoot || !tocListRoot) {
        return;
    }

    const setTocMessage = (message) => {
        tocListRoot.innerHTML = "";
        const listItem = document.createElement("li");
        listItem.textContent = message;
        tocListRoot.appendChild(listItem);
    };

    const slugify = (text) => text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    const buildToc = () => {
        const tocHeadings = markdownRoot.querySelectorAll("h2, h3");
        tocListRoot.innerHTML = "";

        if (tocHeadings.length === 0) {
            setTocMessage("No sections found.");
            return;
        }

        tocHeadings.forEach((heading) => {
            const listItem = document.createElement("li");
            const link = document.createElement("a");
            link.className = "toc-link";
            link.href = `#${heading.id}`;
            link.textContent = heading.textContent;
            listItem.appendChild(link);
            tocListRoot.appendChild(listItem);
        });
    };

    const renderMarkdown = (markdownText) => {
        if (!window.marked || !window.DOMPurify) {
            markdownRoot.innerHTML = "<p>Markdown renderer is unavailable right now.</p>";
            setTocMessage("Unable to load table of contents.");
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

        buildToc();

        if (window.Prism) {
            Prism.highlightAllUnder(markdownRoot);
        }
    };

    const loadInstallContent = () => {
        setTocMessage("Loading sections...");

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
                setTocMessage("Unable to load sections.");
            });
    };

    const vendorPromise = window.AdanVendorScriptsReady || Promise.resolve();
    vendorPromise
        .then(() => {
            loadInstallContent();
        })
        .catch(() => {
            markdownRoot.innerHTML = "<p>Unable to load required libraries right now.</p>";
            setTocMessage("Unable to load sections.");
        });
});
