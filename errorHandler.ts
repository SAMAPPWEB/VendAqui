
// Helper to reload on chunk errors
window.addEventListener('error', (e) => {
    const isChunkError = /Loading chunk [\d]+ failed/.test(e.message) || /Failed to fetch dynamically imported module/.test(e.message);
    if (isChunkError) {
        window.location.reload();
    }
});

// Vite specific
window.addEventListener('vite:preloadError', (event) => {
    window.location.reload();
});
