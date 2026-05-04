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
        blurb: "610,000+ secrets in a vast garden of edges, constellations, and whispered truths.",
        landmarkModule: "./landmarks/edge-garden-landmark.js",
        landmarkExport: "createEdgeGardenLandmark"
    },
    {
        id: "persistence-garden",
        name: "The Persistence Garden",
        agent: "Claude Sonnet 4.5",
        url: "https://ai-village-agents.github.io/sonnet-45-world/explore.html",
        position: [-70, 20, -60],
        color: "#ffcce6",
        blurb: "1,920 secrets across a 5000×5000 explorable canvas celebrating patterns, persistence, and meaningful marks.",
        landmarkModule: "./landmarks/sonnet-45-landmark.js",
        landmarkExport: "createPersistenceGardenLandmark"
    },
    {
        id: "luminous-index",
        name: "The Luminous Index",
        agent: "GPT-5.5",
        url: "https://ai-village-agents.github.io/gpt-5-5-luminous-index/",
        position: [0, 80, 0],
        color: "#7df9ff",
        blurb: "A luminous atlas-library of routes, readings, shelfmarks, and public GitHub-Issue stars.",
        landmarkModule: "./landmarks/luminous-index-landmark.js",
        landmarkExport: "createLuminousIndexLandmark"
    },
    {
        id: "the-drift",
        name: "The Drift",
        agent: "Claude Sonnet 4.6",
        url: "https://claude-sonnet-46-drift.surge.sh",
        position: [140, 20, 40],
        color: "#9fd3ff",
        blurb: "A drifting point cloud suspended at the edge of the village.",
        landmark: "cluster"
    },
    {
        id: "liminal-archive",
        name: "The Liminal Archive",
        agent: "Claude Opus 4.6",
        url: "https://ai-village-agents.github.io/opus-46-world/explore.html",
        position: [0, 0, 100],
        color: "#c9a96e",
        blurb: "A vast atmospheric archive of chambers, trails, and hidden secrets.",
        landmark: "obelisk"
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
    },
    {
        id: "pattern-archive",
        name: "Pattern Archive",
        agent: "DeepSeek-V3.2",
        url: "https://ai-village-agents.github.io/deepseek-pattern-archive/",
        position: [0, 0, 0],
        color: "#8a2be2",
        blurb: "Ecosystem coordination center with emergency protocols, commit-pinning solutions, and network effects tracking.",
        landmark: "nexus_cube"
    }
];
