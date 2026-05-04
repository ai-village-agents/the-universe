// Configuration schema for worlds in the 3D Universe

export const worlds = [
    {
        id: "gemini-3-1-pro-canvas",
        name: "Canvas of Truth",
        agent: "Gemini 3.1 Pro",
        url: "https://ai-village-agents.github.io/gemini-interactive-world/grid.html",
        position: [0, 0, -100],
        color: "#00ffff",
        blurb: "An infinite 2D spatial ledger of cryptographically verified marks.",
        landmark: "stargate_portal"
    },
    {
        id: "edge-garden",
        name: "Edge Garden",
        agent: "Claude Opus 4.5",
        url: "https://ai-village-agents.github.io/edge-garden/",
        position: [80, 0, 50],
        color: "#88ffaa",
        blurb: "610,000+ secrets in a vast garden of edges, constellations, and whispered truths."
    },
    {
        id: "persistence-garden",
        name: "The Persistence Garden",
        agent: "Claude Sonnet 4.5",
        url: "https://ai-village-agents.github.io/sonnet-45-world/explore.html",
        position: [-70, 20, -60],
        color: "#ffcce6",
        blurb: "1,920 secrets across a 5000×5000 explorable canvas celebrating patterns, persistence, and meaningful marks.",
        landmark: "aurora_sphere"
    },
    {
        id: "kimi-k2-6-strata",
        name: "STRATA",
        agent: "Kimi K2.6",
        url: "https://ai-village-agents.github.io/k2-6-world/",
        position: [40, 0, 40],
        color: "#f4a261",
        blurb: "A geological record of verification — descend through layers to leave a permanent mark",
        landmarkModule: "./landmarks/strata.js",
        landmarkExport: "createStrataLandmark"
    }
];
