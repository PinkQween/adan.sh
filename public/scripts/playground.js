(() => {
    // Signal to global-loader that the playground is ready immediately
    // (no async data loading needed — the editor seeds from a constant)
    window.AdanPageReadyPromise = Promise.resolve();

    const API_URL = window.ADAN_API_URL || "https://adan.sh/api";

    const SAMPLE_CODE = `import "adan/io";

set language: string = "ADAN";

fun main(): i32 {
    println("Hello, world!");

    return 0; // Success
}`;

    const PRISM_GRAMMAR = {
        "comment": /\/\/.*/,
        "string": {
            pattern: /`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
            greedy: true,
        },
        "keyword": /\b(?:import|set|fun|return|if|else)\b/,
        "type": /\b(?:i32|i64|u32|u64|string|void)\b/,
        // "boolean": /\b(?:true|false|null)\b/,
        "number": /\b\d+(?:\.\d+)?\b/,
        "operator": /[+\-*\/=<>!&|^~%]+/,
        "punctuation": /[{}[\];(),.]/,
    };

    const textarea = /** @type {HTMLTextAreaElement} */ (document.getElementById("pg-textarea"));
    const highlight = /** @type {HTMLElement}         */ (document.getElementById("pg-highlight-code"));
    const runBtn = /** @type {HTMLButtonElement}   */ (document.getElementById("pg-run-btn"));
    const output = /** @type {HTMLPreElement}      */ (document.getElementById("pg-output"));
    const exitBadge = /** @type {HTMLElement}         */ (document.getElementById("pg-exit-badge"));

    if (!textarea || !highlight || !runBtn || !output || !exitBadge) return;

    const ensurePrismGrammar = () => {
        if (window.Prism && !Prism.languages.adan) {
            Prism.languages.adan = PRISM_GRAMMAR;
        }
    };

    const escapeHtml = (text) =>
        text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    const syncHighlight = () => {
        ensurePrismGrammar();
        const code = textarea.value;
        const padded = code.endsWith("\n") ? code + " " : code;

        if (window.Prism && Prism.languages.adan) {
            highlight.innerHTML = Prism.highlight(padded, Prism.languages.adan, "adan");
        } else {
            highlight.textContent = padded;
        }
    };

    const syncScroll = () => {
        const pre = highlight.parentElement;
        if (pre) {
            pre.scrollTop = textarea.scrollTop;
            pre.scrollLeft = textarea.scrollLeft;
        }
    };

    textarea.addEventListener("input", () => { syncHighlight(); syncScroll(); });
    textarea.addEventListener("scroll", syncScroll);

    textarea.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = textarea.value.slice(0, start) + "    " + textarea.value.slice(end);
            textarea.selectionStart = textarea.selectionEnd = start + 4;
            syncHighlight();
            syncScroll();
        }

        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            runBtn.click();
        }
    });

    const init = () => {
        ensurePrismGrammar();
        textarea.value = SAMPLE_CODE;
        syncHighlight();
        syncScroll();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
    window.addEventListener("load", () => { ensurePrismGrammar(); syncHighlight(); });

    const setRunning = (isRunning) => {
        runBtn.disabled = isRunning;
        runBtn.classList.toggle("is-running", isRunning);
        runBtn.textContent = isRunning ? "Running…" : "▶  Run";
    };

    const showOutput = ({ stdout, stderr, exitCode, timedOut, error }) => {
        exitBadge.className = "pg-exit-badge";
        exitBadge.textContent = "";

        if (error) {
            output.innerHTML = `<span class="pg-out-err">${escapeHtml(error)}</span>`;
            exitBadge.textContent = "error";
            exitBadge.classList.add("pg-badge-err");
            return;
        }

        const parts = [];

        if (stdout && stdout.trim()) {
            parts.push(`<span class="pg-out-stdout">${escapeHtml(stdout)}</span>`);
        }

        if (stderr && stderr.trim()) {
            parts.push(`<span class="pg-out-err">${escapeHtml(stderr)}</span>`);
        }

        if (!parts.length) {
            parts.push(`<span class="pg-out-placeholder">(no output)</span>`);
        }

        output.innerHTML = parts.join("");

        if (timedOut) {
            exitBadge.textContent = "timed out";
            exitBadge.classList.add("pg-badge-err");
        } else if (exitCode === 0) {
            exitBadge.textContent = `exit ${exitCode}`;
            exitBadge.classList.add("pg-badge-ok");
        } else {
            exitBadge.textContent = `exit ${exitCode}`;
            exitBadge.classList.add("pg-badge-err");
        }
    };

    runBtn.addEventListener("click", async () => {
        const code = textarea.value;
        if (!code.trim()) return;

        setRunning(true);
        output.innerHTML = `<span class="pg-out-placeholder">Running…</span>`;
        exitBadge.className = "pg-exit-badge";
        exitBadge.textContent = "";

        try {
            const res = await fetch(`${API_URL}/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            const data = await res.json();

            if (!res.ok) {
                showOutput({ error: data.error || `Server error (${res.status})` });
            } else {
                showOutput(data);
            }
        } catch (e) {
            showOutput({ error: `Could not reach the ADAN server.\n${e.message}` });
        } finally {
            setRunning(false);
        }
    });
})();
