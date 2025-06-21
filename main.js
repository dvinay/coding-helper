const { app, BrowserWindow, globalShortcut, desktopCapturer } = require('electron');
const { ipcMain, screen } = require('electron');
const { Menu } = require('electron');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');

let openaiApiKey = process.env.OPENAI_API_KEY || '';
let win;
let screenshotCount = 0;
const maxScreenshots = 5;
let windowSize = { width: 325, height: 60 };  // Default small size
let lastCursorPos = { x: 0, y: 0 }; // To store cursor position
let tooltipWin = null;
let currentLanguage = 'Python';
let solutionWin;

const openai = new OpenAI({
    apiKey: openaiApiKey
});

// Function to create the Electron window
function createWindow() {
    win = new BrowserWindow({
        width: windowSize.width,
        height: windowSize.height,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        hasShadow: false,
        skipTaskbar: true,
        focusable: false,  // Ensure the app doesn't take focus
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile('index.html');
    win.setIgnoreMouseEvents(true);  // Ensure the app doesn't block mouse events
    win.setHiddenInMissionControl(true); // Hide in Mission Control on macOS
    win.setContentProtection(true); // prevents capture
    win.setAlwaysOnTop(true, 'screen-saver', 1); // Always on top of other windows

    if (process.platform === 'win32') {
        win.setWindowDisplayAffinity('exclusive');
    }

    Menu.setApplicationMenu(null);

    //win.webContents.openDevTools({ mode: 'detach' });
}

function resetScreenshotCount() {
    screenshotCount = 0;

    if (solutionWin && !solutionWin.isDestroyed()) {
        solutionWin.close();
        solutionWin = null;
    }

    // Clean up screenshots directory
    try {
        const screenshotsDir = path.join(__dirname, 'screenshots');
        if (fs.existsSync(screenshotsDir)) {
            const files = fs.readdirSync(screenshotsDir);
            for (const file of files) {
                if (file.startsWith('screenshot_') && file.endsWith('.png')) {
                    fs.unlinkSync(path.join(screenshotsDir, file));
                }
            }
        }
    } catch (error) {
        console.error('Error cleaning up screenshots:', error);
    }
    console.log("🗑️ Screenshot count reset");
}

async function takeScreenshot() {
    if (screenshotCount >= maxScreenshots) {
        console.log("🚫 Screenshot limit reached (5)");
        return;
    }

    if (!win) return;

    const currentBounds = win.getBounds();
    const winWasVisible = win.isVisible();

    // Hide the window temporarily
    win.hide();

    // Small delay to ensure the window is fully hidden before capture
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
        const allSources = await desktopCapturer.getSources({ types: ['screen'] });
        const allDisplays = screen.getAllDisplays();
        // Get main window's position
        const winBounds = win.getBounds();

        // Find the display the window is mostly on
        const display = screen.getDisplayNearestPoint({ x: winBounds.x, y: winBounds.y });
        const displayIndex = allDisplays.findIndex(d => d.id === display.id);
        const source = allSources[displayIndex];

        if (!source) {
            console.log('🛑 No matching screen found for the window position.');
            return;
        }

        const image = source.thumbnail.toPNG();
        // Get the current project directory
        const screenshotsDir = path.join(__dirname, 'screenshots');

        // Create screenshots directory if it doesn't exist
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir);
        }

        // Save screenshots to project directory
        const savePath = path.join(screenshotsDir, `screenshot_${Date.now()}.png`);

        fs.writeFileSync(savePath, image);
        screenshotCount++;

        console.log(`✅ Screenshot ${screenshotCount}/5 saved to: ${savePath}`);
    } catch (error) {
        console.error('Error taking screenshot:', error);
    } finally {
        // Restore window with original bounds
        if (winWasVisible) {
            win.setBounds(currentBounds);
            win.show();
        }
    }
    if (winWasVisible) win.show();
}

async function sendScreenshotsToOpenAI() {
    try {
        // Dynamically create the solution window
        const mainBounds = win.getBounds();

        solutionWin = new BrowserWindow({
            width: 400,
            height: 300,
            x: mainBounds.x,
            y: mainBounds.y + mainBounds.height + 8,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            resizable: false,
            skipTaskbar: true,
            focusable: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
            }
        });

        solutionWin.loadFile('solution.html');
        solutionWin.setIgnoreMouseEvents(true);  // Ensure the app doesn't block mouse events
        solutionWin.setHiddenInMissionControl(true); // Hide in Mission Control on macOS
        solutionWin.setContentProtection(true); // prevents capture
        solutionWin.setAlwaysOnTop(true, 'screen-saver', 1); // Always on top of other windows

        if (process.platform === 'win32') {
            solutionWin.setWindowDisplayAffinity('exclusive');
        }


        const screenshotsDir = path.join(__dirname, 'screenshots');
        const files = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png')).slice(0, 5);

        if (files.length === 0) {
            console.log('No screenshots available.');
            return;
        }

        const imagesBase64 = files.map(file => {
            const filepath = path.join(screenshotsDir, file);
            return fs.readFileSync(filepath, { encoding: 'base64' });
        });

        const language = currentLanguage || 'Python'; // Get from tooltip selection!

        const openai = new OpenAI({ apiKey: openaiApiKey });

        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert programmer. Based on the following screenshots and selected language "${language}", generate:
          1. A two-line explanation of the problem.
          2. The code solution in ${language}.
          3. Time and Space complexity.
          If something is unclear, assume best reasonable coding problem.`
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Please analyze the following screenshots and provide a optimum solution in ${language}.`
                        },
                        ...imagesBase64.map(base64 => ({
                            type: "image_url",
                            image_url: { url: `data:image/jpeg;base64,${base64}` },
                        }))
                    ]
                },
            ],
            max_tokens: 300,
            temperature: 0.2,
        });

        const answer = response.choices[0].message.content;
        //console.debug('OpenAI response message content:', answer);

        // Send solution to window if it still exists
        if (!solutionWin.isDestroyed()) {
            solutionWin.webContents.send('display-solution', answer);
        }

        solutionWin.webContents.once('did-finish-load', () => {
            solutionWin.webContents.send('display-solution', answer);
        });

        //solutionWin.webContents.openDevTools({ mode: 'detach' });

        for (const file of files) {
            fs.unlinkSync(path.join(screenshotsDir, file));
        }
    } catch (error) {
        console.error('Error sending screenshots to OpenAI:', error);
        if (solutionWin && !solutionWin.isDestroyed()) {
            solutionWin.webContents.send('display-error', 'Failed to contact OpenAI.');
        }
    }
}

// Move window based on Arrow key presses
function moveWindow(direction) {
    const currentBounds = win.getBounds();
    let newX = currentBounds.x;
    let newY = currentBounds.y;

    const moveDistance = 50; // Move 50 pixels per key press

    switch (direction) {
        case 'left':
            newX -= moveDistance;
            break;
        case 'right':
            newX += moveDistance;
            break;
        case 'up':
            newY -= moveDistance;
            break;
        case 'down':
            newY += moveDistance;
            break;
    }

    // Move the window to the new position
    win.setBounds({ x: newX, y: newY, width: windowSize.width, height: windowSize.height });

    // Move tooltip window if visible
    if (tooltipWin && !tooltipWin.isDestroyed() && tooltipWin.isVisible()) {
        const tooltipBounds = tooltipWin.getBounds();
        tooltipWin.setBounds({
            x: tooltipBounds.x + (newX - currentBounds.x),
            y: tooltipBounds.y + (newY - currentBounds.y),
            width: tooltipBounds.width,
            height: tooltipBounds.height
        });
    }

    // Move solution window if visible
    if (solutionWin && !solutionWin.isDestroyed() && solutionWin.isVisible()) {
        const solutionBounds = solutionWin.getBounds();
        solutionWin.setBounds({
            x: solutionBounds.x + (newX - currentBounds.x),
            y: solutionBounds.y + (newY - currentBounds.y),
            width: solutionBounds.width,
            height: solutionBounds.height
        });
    }
}

function showTooltipWindow(x, y) {
    if (tooltipWin) {
        tooltipWin.setBounds({ x, y });
        tooltipWin.show();
        return;
    }

    tooltipWin = new BrowserWindow({
        width: 360,
        height: 250,
        x,
        y,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        focusable: true,
        show: false, // delay show to allow positioning
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    tooltipWin.loadFile('tooltip.html');

    tooltipWin.webContents.once('did-finish-load', async () => {
        try {
            tooltipWin.webContents.send('fetch-api-key', openaiApiKey);
            tooltipWin.webContents.send('set-language-dropdown', currentLanguage);

            // Ask renderer to calculate its height
            const size = await tooltipWin.webContents.executeJavaScript(`
              new Promise(resolve => {
                const body = document.body;
                const width = Math.floor(body.scrollWidth);
                const height = Math.floor(body.scrollHeight);
                resolve({ width, height });
              });
            `);

            tooltipWin.setBounds({ x, y, width: size.width, height: size.height });
            tooltipWin.show();
        } catch (error) {
            console.error('Error calculating tooltip size:', error);
            tooltipWin.setBounds({ x, y, width: 300, height: 100 });
            tooltipWin.show();
        }
    });
    //tooltipWin.setIgnoreMouseEvents(true);  // Ensure the app doesn't block mouse events
    tooltipWin.setHiddenInMissionControl(true); // Hide in Mission Control on macOS
    tooltipWin.setContentProtection(true); // prevents capture
    tooltipWin.setAlwaysOnTop(true, 'screen-saver', 1); // Always on top of other windows

    if (process.platform === 'win32') {
        tooltipWin.setWindowDisplayAffinity('exclusive');
    }

    tooltipWin.on('closed', () => {
        tooltipWin = null;
    });

    /*
    tooltipWin.once('ready-to-show', () => {
        const handleBuffer = tooltipWin.getNativeWindowHandle();
        const handle = handleBuffer.readBigUInt64LE();
        hider.hideFromScreenShare(handle);
    });
    */

    //tooltipWin.webContents.openDevTools({ mode: 'detach' });
}

function hideTooltipWindow() {
    if (tooltipWin) {
        tooltipWin.close();
        tooltipWin = null;
    }
}


ipcMain.on('show-tooltip', (event, mouseX, mouseY) => {
    showTooltipWindow(mouseX, mouseY + 8);
});

ipcMain.on('hide-tooltip', () => {
    hideTooltipWindow();
});

ipcMain.on('set-language', (event, lang) => {
    console.log('set-language :: Previous language:', currentLanguage);
    currentLanguage = lang;
    console.log('set-language :: currentLanguage:', currentLanguage);
});

ipcMain.on('set-api-key', (event, key) => {
    openaiApiKey = key;
    console.log('OpenAI API key updated');
});

ipcMain.once('resize-solution-window', (event, { width, height }) => {
    solutionWin.setSize(width, height);
});

ipcMain.on('hide-solution-window', () => {
    if (solutionWin && !solutionWin.isDestroyed()) {
        solutionWin.hide();
    }
});

app.commandLine.appendSwitch('enable-features', 'ScreenCaptureKitMac');
app.commandLine.appendSwitch('disable-features', 'IOSurfaceCapturer')
app.commandLine.appendSwitch('disable-features', 'IOSurfaceCapturer,DesktopCaptureMacV2')

app.whenReady().then(() => {
    createWindow();

    const ctrlH = process.platform === 'darwin' ? 'Command+H' : 'Control+H';
    const ctrlR = process.platform === 'darwin' ? 'Command+R' : 'Control+R';
    const ctrlB = process.platform === 'darwin' ? 'Command+B' : 'Control+B';
    const ctrlComma = process.platform === 'darwin' ? 'Command+,' : 'Control+,';

    // Register keyboard shortcuts
    globalShortcut.register(ctrlH, takeScreenshot);
    globalShortcut.register(ctrlR, resetScreenshotCount);
    globalShortcut.register(ctrlB, () => {
        // Toggle tooltip window
        if (tooltipWin && !tooltipWin.isDestroyed()) {
            if (tooltipWin.isVisible()) {
                tooltipWin.hide();
            } else {
                tooltipWin.show();
            }
        }

        // Toggle solution window
        if (solutionWin && !solutionWin.isDestroyed()) {
            if (solutionWin.isVisible()) {
                solutionWin.hide();
            } else {
                solutionWin.show();
            }
        }
    });

    globalShortcut.register(ctrlComma, () => {
        if (tooltipWin && !tooltipWin.isDestroyed()) {
            hideTooltipWindow();
        } else {
            const bounds = win.getBounds();
            const gearIconPosition = {
                x: bounds.x + bounds.width - 40, // Approximate gear icon position
                y: bounds.y + bounds.height
            };
            showTooltipWindow(parseInt(gearIconPosition.x), parseInt(gearIconPosition.y));
        }
    });

    // Arrow keys (Ctrl + Arrow) to move the window
    globalShortcut.register('Command+Right', () => moveWindow('right'));  // Move right
    globalShortcut.register('Command+Left', () => moveWindow('left'));    // Move left
    globalShortcut.register('Command+Up', () => moveWindow('up'));       // Move up
    globalShortcut.register('Command+Down', () => moveWindow('down'));   // Move down

    globalShortcut.register('CommandOrControl+Enter', () => { sendScreenshotsToOpenAI(); });

    // For Windows/Linux, use Control key instead of Command key
    if (process.platform !== 'darwin') {
        globalShortcut.register('Control+Right', () => moveWindow('right'));
        globalShortcut.register('Control+Left', () => moveWindow('left'));
        globalShortcut.register('Control+Up', () => moveWindow('up'));
        globalShortcut.register('Control+Down', () => moveWindow('down'));
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.dock.hide();

if (process.platform === 'darwin') {
    app.dock.hide();
}

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
