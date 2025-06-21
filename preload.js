const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    showTooltip: (x, y) => ipcRenderer.send('show-tooltip', x, y),
    hideTooltip: () => ipcRenderer.send('hide-tooltip'),
    onDisplaySolution: (callback) => ipcRenderer.on('display-solution', (event, data) => callback(data)),
    onError: (callback) => ipcRenderer.on('display-error', (event, data) => callback(data)),
    requestResize: (width, height) => ipcRenderer.send('resize-solution-window', { width, height }),
    setLanguageDropdown: (callback) => ipcRenderer.on('set-language-dropdown', (event, language) => callback(language)),
    fetchApiKey: (callback) => ipcRenderer.on('fetch-api-key', (event, key) => callback(key)),
    setLanguage: (lang) => ipcRenderer.send('set-language', lang),
    sendApiKey: (key) => ipcRenderer.send('set-api-key', key),
    hideSolutionWindow: () => ipcRenderer.send('hide-solution-window'),
    showGearTooltip: () => {
        const bounds = document.getElementById('gear').getBoundingClientRect();
        ipcRenderer.send('show-tooltip', bounds.right, bounds.bottom);
    }
});
