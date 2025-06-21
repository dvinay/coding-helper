window.addEventListener('DOMContentLoaded', () => {
    const gear = document.getElementById('gear');
    let tooltipVisible = false;

    gear.addEventListener('click', (event) => {

        event.stopPropagation(); // prevent triggering document click
        if (!tooltipVisible) {
            const rect = gear.getBoundingClientRect();
            const mouseX = window.screenX + rect.left + rect.width / 2;
            const mouseY = window.screenY + rect.top + rect.height;

            window.electronAPI.showTooltip(parseInt(mouseX), parseInt(mouseY));
        } else {
            window.electronAPI.hideTooltip();
        }
        tooltipVisible = !tooltipVisible;
    });

    document.addEventListener('click', (event) => {
        if (tooltipVisible) {
            window.electronAPI.hideTooltip();
            tooltipVisible = false;
        }
    });
});