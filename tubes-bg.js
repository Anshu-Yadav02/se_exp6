/**
 * Tubes Interactive Background
 * Adapted from threejs-components by Kevin Levron
 * Loads the 3D neon tubes effect onto a full-screen canvas behind page content.
 *
 * Usage: Just include <script src="tubes-bg.js"></script> at the end of <body>.
 * The script auto-creates the canvas and initializes everything.
 */

(function () {

    // ── Create the full-screen canvas ──
    const canvas = document.createElement("canvas");
    canvas.id = "tubesCanvas";
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 0;
        display: block;
        touch-action: none;
    `;
    document.body.prepend(canvas);

    // ── Color randomizer ──
    function randomColors(count) {
        return Array.from({ length: count }, () =>
            "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")
        );
    }

    // ── Load and initialize ──
    let tubesApp = null;

    async function initTubes() {
        try {
            const module = await import(
                "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js"
            );
            const TubesCursor = module.default;

            tubesApp = TubesCursor(canvas, {
                tubes: {
                    colors: ["#6366f1", "#818cf8", "#a78bfa"],
                    lights: {
                        intensity: 200,
                        colors: ["#667eea", "#764ba2", "#ff008a", "#60aed5"]
                    }
                }
            });

            // Reveal canvas smoothly after init
            canvas.style.opacity = "0";
            canvas.style.transition = "opacity 1.2s ease";
            requestAnimationFrame(() => {
                canvas.style.opacity = "1";
            });

        } catch (err) {
            console.warn("Tubes background failed to load:", err);
            // Graceful fallback — the CSS gradient background still shows
            canvas.style.display = "none";
        }
    }

    initTubes();

    // ── Click to randomize colors ──
    document.addEventListener("click", function (e) {
        // Don't randomize if clicking on interactive elements
        const tag = e.target.tagName.toLowerCase();
        const isInteractive = (
            tag === "input" ||
            tag === "button" ||
            tag === "select" ||
            tag === "a" ||
            tag === "label" ||
            tag === "textarea" ||
            e.target.closest("form") ||
            e.target.closest("a") ||
            e.target.closest("button")
        );

        if (isInteractive || !tubesApp) return;

        const colors = randomColors(3);
        const lightsColors = randomColors(4);

        tubesApp.tubes.setColors(colors);
        tubesApp.tubes.setLightsColors(lightsColors);
    });

})();
