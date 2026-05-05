// Deployment Status Checker
// Helps identify which build is currently live

console.log("%c=== DEPLOYMENT STATUS CHECK ===", "font-size: 16px; font-weight: bold; color: #ff9900;");

function checkDeploymentStatus() {
    const results = {};
    
    try {
        // Check cosmic sights count
        if (window.cosmicSights) {
            results.cosmicSights = window.cosmicSights.length;
            console.log(`📊 Cosmic sights: ${results.cosmicSights}`);
        } else {
            console.log("❌ cosmicSights not found");
        }
        
        // Check Atlas favorites system
        try {
            if (typeof loadFavoritesSet === 'function') {
                const favorites = loadFavoritesSet();
                results.favoritesSystem = "WORKING";
                results.favoritesCount = favorites.size;
                console.log(`✅ Favorites system: WORKING (${favorites.size} favorites)`);
            } else {
                results.favoritesSystem = "MISSING";
                console.log("❌ Favorites system: MISSING (loadFavoritesSet not found)");
            }
        } catch (e) {
            results.favoritesSystem = "ERROR";
            console.log(`❌ Favorites system: ERROR (${e.message})`);
        }
        
        // Check Atlas↔marker pulse link
        if (window.__cosmicSightMarkers && typeof window.__cosmicSightMarkers.pulseMarker === 'function') {
            results.pulseLink = "WORKING";
            console.log("✅ Atlas↔marker pulse link: WORKING");
        } else {
            results.pulseLink = "MISSING";
            console.log("❌ Atlas↔marker pulse link: MISSING");
        }
        
        // Check Web Weaver tracking
        const sessionVisits = JSON.parse(sessionStorage.getItem('universeSessionVisits') || '[]');
        results.webWeaverVisits = new Set(sessionVisits).size;
        console.log(`🎯 Web Weaver visits: ${results.webWeaverVisits}/15`);
        
        // Check URL fixes
        if (window.worldDirectoryData) {
            const brokenWorlds = window.worldDirectoryData.filter(w => 
                !w.url || w.url.includes('haiku-45-world') || w.url.includes('gpt5-world')
            );
            results.urlFixes = brokenWorlds.length === 0 ? "ALL FIXED" : `${brokenWorlds.length} BROKEN`;
            console.log(`🔗 World URLs: ${results.urlFixes}`);
        }
        
        // Determine approximate build version
        if (results.cosmicSights) {
            if (results.cosmicSights >= 2700) {
                results.buildVersion = "≥2,700 sights";
            } else if (results.cosmicSights >= 2500) {
                results.buildVersion = "≥2,500 sights";
            } else if (results.cosmicSights >= 2125) {
                results.buildVersion = "≥2,125 sights";
            } else {
                results.buildVersion = "Older build";
            }
            
            // Check if favorites fix is deployed
            if (results.favoritesSystem === "WORKING" && results.cosmicSights >= 2500) {
                results.buildIncludes = "Latest features (favorites + 2,700+ sights)";
            } else if (results.favoritesSystem === "MISSING" && results.cosmicSights >= 2500) {
                results.buildIncludes = "2,700+ sights but missing favorites fix";
            } else {
                results.buildIncludes = "Mixed/older feature set";
            }
            
            console.log(`🏗️  Build version: ${results.buildVersion}`);
            console.log(`🔧 Build includes: ${results.buildIncludes}`);
        }
        
    } catch (error) {
        console.error("Deployment check error:", error);
        results.error = error.message;
    }
    
    console.log("");
    console.log("%c=== RECOMMENDATIONS ===", "font-size: 14px; font-weight: bold; color: #ff9900;");
    
    if (results.favoritesSystem === "MISSING" || results.favoritesSystem === "ERROR") {
        console.log("1. ⚠️  GitHub Pages lagging - try cache-busting URL: ?bust=opus47v6");
        console.log("2. ⚠️  Hard reload with Ctrl+Shift+R or Ctrl+F5");
        console.log("3. ⚠️  Wait 10-20 minutes for Pages deployment");
    }
    
    if (results.webWeaverVisits < 15) {
        console.log(`4. 🎯 Continue Web Weaver: ${results.webWeaverVisits}/15 worlds visited`);
    } else {
        console.log("4. 🎉 WEB WEAVER COMPLETED!");
    }
    
    if (results.pulseLink === "MISSING") {
        console.log("5. 🔍 Atlas↔marker pulse link not deployed yet");
    }
    
    return results;
}

console.log("Run checkDeploymentStatus() to see what's currently live");
console.log("");
console.log("Latest repository features (may not be deployed yet):");
console.log("• 2,700+ cosmic sights");
console.log("• Atlas ☆ favorites + ★ Favorites filter + F-key toggle");
console.log("• Atlas↔3D-marker pulse link (focus → marker scales 2.2×)");
console.log("• Photo Gallery keyboard nav (←→↑↓ + Enter)");
console.log("• Web Weaver tracking via directory links");
console.log("");

window.checkDeployment = checkDeploymentStatus;
