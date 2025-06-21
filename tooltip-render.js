window.addEventListener('DOMContentLoaded', () => {
    const langSelect = document.getElementById('language-select');
    const input = document.getElementById('apiKeyInput');

    window.electronAPI.setLanguageDropdown((language) => {
        console.log('🔵 Setting dropdown to:', language);
        if (langSelect) {
            langSelect.value = language;
        }
    });

    window.electronAPI.fetchApiKey((savedApiKey) => {
        console.log('🔵 Setting api key');
        if (input) {
            input.value = savedApiKey;
        }
    });

    langSelect.addEventListener('change', (event) => {
        const selectedLanguage = event.target.value;
        console.log(`Selected language: ${selectedLanguage}`);
        window.electronAPI.setLanguage(selectedLanguage);
    });


    input.addEventListener('input', () => {
        const key = input.value.trim();
        if (key.length > 10) {
            window.electronAPI.sendApiKey(key);
        }
    });
});