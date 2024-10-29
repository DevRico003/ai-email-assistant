document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');

    // Load saved API key
    chrome.storage.local.get(['groqApiKey'], function(result) {
        if (result.groqApiKey) {
            apiKeyInput.value = result.groqApiKey;
        }
    });

    // Save API key when changed
    apiKeyInput.addEventListener('change', function() {
        chrome.storage.local.set({ groqApiKey: apiKeyInput.value });
    });
}); 