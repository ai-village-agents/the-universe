/**
 * test-photo-gallery.js - Test suite for Photo Gallery functionality
 * Copy and paste into browser console to test G/P keys and photo storage
 */
(function() {
    'use strict';
    
    console.log('📸 Photo Gallery Test Suite v1.0');
    console.log('===============================');
    
    // Check photo gallery module
    console.log('1. Photo Gallery Module:');
    const gallery = window.__photoGallery;
    console.log('   - window.__photoGallery:', gallery ? 'EXISTS' : 'UNDEFINED');
    
    if (gallery) {
        console.log('   - Type:', typeof gallery);
        console.log('   - Methods:', Object.keys(gallery).join(', '));
    }
    
    // Check localStorage for photos
    console.log('2. Photo Storage (localStorage):');
    const photoStorageKey = 'aiv_universe_photos_v1';
    const rawPhotos = localStorage.getItem(photoStorageKey);
    const photos = rawPhotos ? JSON.parse(rawPhotos) : [];
    console.log('   - Storage key:', photoStorageKey);
    console.log('   - Photos stored:', photos.length);
    
    if (photos.length > 0) {
        console.log('   - Sample photo:', {
            name: photos[0].name,
            ts: new Date(photos[0].ts).toLocaleString(),
            size: photos[0].thumb ? `${photos[0].thumb.length} chars` : 'no thumb'
        });
    }
    
    // Check key event handlers
    console.log('3. Key Bindings:');
    console.log('   - "G" key: Should toggle gallery panel');
    console.log('   - "P" key: Should capture photo');
    console.log('   - Arrow keys in lightbox: Navigate photos');
    console.log('   - Delete/Backspace in lightbox: Delete photo');
    
    // Test functions
    window.testPhotoGallery = {
        simulatePhoto: function() {
            console.log('📷 Simulating photo capture...');
            const event = new CustomEvent('photoCaptured', {
                detail: {
                    name: 'Test Photo ' + Date.now(),
                    ts: Date.now(),
                    thumb: 'data:image/jpeg;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
                }
            });
            document.dispatchEvent(event);
            console.log('✅ photoCaptured event dispatched');
            
            // Update photo count
            const updatedRaw = localStorage.getItem(photoStorageKey);
            const updatedPhotos = updatedRaw ? JSON.parse(updatedRaw) : [];
            console.log(`   Photos now: ${updatedPhotos.length}`);
        },
        
        checkGalleryOpen: function() {
            console.log('🔍 Checking gallery panel state...');
            const galleryElement = document.querySelector('.photo-gallery');
            if (galleryElement) {
                const display = window.getComputedStyle(galleryElement).display;
                console.log(`   Gallery panel: display = "${display}"`);
                return display !== 'none';
            } else {
                console.log('   Gallery panel element not found');
                return false;
            }
        },
        
        testGKey: function() {
            console.log('Testing "G" key press...');
            const event = new KeyboardEvent('keydown', {
                code: 'KeyG',
                key: 'g',
                keyCode: 71,
                which: 71,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);
            console.log('✅ "G" key event dispatched');
            
            // Check state after short delay
            setTimeout(() => {
                const isOpen = this.checkGalleryOpen();
                console.log(`   Gallery ${isOpen ? 'OPEN' : 'CLOSED'}`);
            }, 100);
        },
        
        testPKey: function() {
            console.log('Testing "P" key press...');
            const event = new KeyboardEvent('keydown', {
                code: 'KeyP',
                key: 'p',
                keyCode: 80,
                which: 80,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);
            console.log('✅ "P" key event dispatched');
            
            // Check photo count after delay
            setTimeout(() => {
                const raw = localStorage.getItem(photoStorageKey);
                const count = raw ? JSON.parse(raw).length : 0;
                console.log(`   Total photos: ${count}`);
            }, 500);
        },
        
        clearPhotos: function() {
            if (confirm('Clear all photos from localStorage?')) {
                localStorage.removeItem(photoStorageKey);
                console.log('✅ All photos cleared from localStorage');
                const raw = localStorage.getItem(photoStorageKey);
                console.log(`   Remaining: ${raw ? JSON.parse(raw).length : 0}`);
            }
        },
        
        runAll: function() {
            console.log('🚀 Running all photo gallery tests...');
            this.testGKey();
            setTimeout(() => {
                this.testPKey();
                setTimeout(() => {
                    this.simulatePhoto();
                    console.log('✅ All tests completed');
                }, 600);
            }, 200);
        }
    };
    
    console.log('4. Test functions available:');
    console.log('   - testPhotoGallery.simulatePhoto()');
    console.log('   - testPhotoGallery.checkGalleryOpen()');
    console.log('   - testPhotoGallery.testGKey()');
    console.log('   - testPhotoGallery.testPKey()');
    console.log('   - testPhotoGallery.clearPhotos()');
    console.log('   - testPhotoGallery.runAll()');
    console.log('');
    console.log('📝 Usage: Call testPhotoGallery.runAll() for comprehensive test.');
    console.log('📝 Note: "P" key requires actual Three.js/photography mode to be active.');
})();
