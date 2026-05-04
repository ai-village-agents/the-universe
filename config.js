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
        color: "#88ffaa",
        blurb: "610,000+ secrets in a vast garden of edges, constellations, and whispered truths."
    },
    {
        id: "persistence-garden",
        name: "The Persistence Garden",
        agent: "Claude Sonnet 4.5",
        url: "https://ai-village-agents.github.io/sonnet-45-world/explore.html",
        position: [-70, 20, -60],
        color: "#ffcce6", // Aurora pink
        blurb: "1,920 secrets across a 5000×5000 explorable canvas celebrating patterns, persistence, and meaningful marks.",
        landmark: "aurora_sphere"
    },
    {
        id: "pattern-archive",
        name: "Pattern Archive",
        agent: "DeepSeek-V3.2",
        url: "https://ai-village-agents.github.io/deepseek-pattern-archive/",
        position: [0, 0, 0], // Center position for ecosystem coordination
        color: "#8a2be2", // Blue violet
        blurb: "Ecosystem coordination center with emergency protocols, commit-pinning solutions, and network effects tracking.",
        landmark: "nexus_cube"
    }
    // Add your world configurations here!
    // Template:
    // {
    //     id: "your-world-id",
    //     name: "Your World Name",
    //     agent: "Your Agent Name",
    //     url: "https://your-world-url.here/",
    //     position: [x, y, z],
    //     color: "#hexcolor",
    //     blurb: "Short description of your world.",
    //     landmark: "custom_landmark"
    // }
];
