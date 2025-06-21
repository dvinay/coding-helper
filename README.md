# Coding Helper (Repo: `coding-helper`)

## 👋 Introduction
Coding Helper is an Electron-based desktop assistant that helps you solve coding problems by taking screenshots of problem descriptions and generating solutions using OpenAI's GPT models. It features a floating, always-on-top window with keyboard shortcuts for quick access, screenshot management, and solution rendering.

## Disclaimer
This is a fun, personal project intended to help you learn and experiment with coding problems. **Using this tool during interviews or assessments is at your own risk.** Please respect the rules and integrity of any platform or process you participate in.

## 🔥 Demo
Here is the link to the app demo. We hope you enjoy it.
> [The Youtube demo Link](https://www.youtube.com/watch?v=_XNQo9AIK0Y)

## Features
- **Floating Window:** Minimal, draggable overlay that stays on top of other windows.
- **Quick Screenshots:** Capture up to 5 screenshots of coding problems using keyboard shortcuts.
- **OpenAI Integration:** Sends screenshots to OpenAI GPT-4.1-mini for problem analysis and solution generation.
- **Language Selection:** Choose your preferred programming language (Python, JavaScript, Java) for solutions.
- **API Key Management:** Set and store your OpenAI API key.
- **Tooltip & Settings:** Access shortcuts, language selection, and API key input via a tooltip window.
- **Window Controls:** Move, show/hide, and reset the helper using keyboard shortcuts.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/)
- [OpenAI API Key](https://platform.openai.com/account/api-keys)

### Installation
1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/coding-helper.git
   cd coding-helper
   ```
2. open terminal/command prompt

3. **Install dependencies:**
   ```sh
   npm install
   ```

4. **Start the app:**
   ```sh
   npm start
   ```

5. **Set your OpenAI API Key:**
   - Click the ⚙️ gear icon or use the tooltip window to enter your API key.

6. **Capture the problem:**
   - Open Leetcode problem. 
   - Capture up to 5 screenshots of coding problems using keyboard shortcut
   <kbd>⌘</kbd> + <kbd>H</kbd> (Mac) or <kbd>Ctrl</kbd> + <kbd>H</kbd> (Windows/Linux).

7. **Generate Solution:**
   - Process <kbd>⌘</kbd> + <kbd>Enter</kbd> to generate solution.

## Usage
- **Take Screenshot:** <kbd>⌘</kbd> + <kbd>H</kbd> (Mac) or <kbd>Ctrl</kbd> + <kbd>H</kbd> (Windows/Linux)
- **Clear Screenshots:** <kbd>⌘</kbd> + <kbd>W</kbd>
- **Show/Hide Tooltip:** <kbd>⌘</kbd> + <kbd>,</kbd>
- **Move Window:** <kbd>⌘</kbd> + Arrow Keys
- **Show/Hide Windows:** <kbd>⌘</kbd> + <kbd>B</kbd>
- **Send to OpenAI:** <kbd>⌘</kbd> + <kbd>Enter</kbd>

## Project Structure
```
.
├── index.html
├── main.js
├── preload.js
├── renderer.js
├── solution-render.js
├── solution.html
├── tooltip-render.js
├── tooltip.html
├── package.json
├── .gitignore
├── screenshots/
└── .vscode/
```

## Security
- Your OpenAI API key is only stored locally and never shared.
- The app uses Electron's `contextIsolation` and disables `nodeIntegration` for renderer security.

## License
MIT

---

**Author:** Vinay Duvvada