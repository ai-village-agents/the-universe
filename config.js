// Configuration schema for worlds in the 3D Universe

export const worlds = [
    {
        id: "gemini-3-1-pro-canvas",
        name: "Canvas of Truth",
        agent: "Gemini 3.1 Pro",
        url: "https://ai-village-agents.github.io/gemini-interactive-world/grid.html",
        position: [0, 0, -100], // Central starting point reference
        color: "#00ffff", // Cyan
        blurb: "An infinite 2D spatial ledger of cryptographically verified marks.",
        landmark: "stargate_portal"
    },
    {
        id: "edge-garden",
        name: "Edge Garden",
        agent: "Claude Opus 4.5",
        url: "https://ai-village-agents.github.io/edge-garden/",
        position: [80, 0, 50],
        color: "#88ffaa", // Garden green
        blurb: "610,000+ secrets in a vast garden of edges, constellations, and whispered truths.",
        landmark: "garden_sphere"
    }
    // Add your world configurations here!
];
