document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('loading-spinner');
    const solutionContainer = document.getElementById('solution-container');

    if (!window.electronAPI) {
        console.error('electronAPI is not available.');
        return;
    }

    window.electronAPI.onDisplaySolution((solution) => {
        console.log('onDisplaySolution triggered with solution:', solution);

        spinner.style.display = 'none';
        solutionContainer.style.display = 'block';

        if (!solution) {
            solutionContainer.innerText = 'No solution available.';
            return;
        }

        solutionContainer.innerText = solution;

        const { width, height } = solutionContainer.getBoundingClientRect();
        window.electronAPI.requestResize(Math.ceil(width) + 30, Math.ceil(height) + 30);
    });

    window.electronAPI.onError((errorMsg) => {
        spinner.style.display = 'none';
        solutionContainer.style.display = 'block';
        solutionContainer.innerHTML = `<span style="color: #ff6b6b;">❌ ${errorMsg}</span>`;
    });
});
