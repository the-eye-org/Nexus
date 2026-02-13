(function () {
    const rainContainer = document.getElementById('rainContainer');
    if (!rainContainer) {
        const container = document.createElement('div');
        container.id = 'rainContainer';
        container.style.position = 'fixed';
        container.style.inset = '0';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '-1';
        container.style.overflow = 'hidden';
        document.body.prepend(container);
    }

    const targetContainer = document.getElementById('rainContainer');
    const dropCount = 100;

    for (let i = 0; i < dropCount; i++) {
        const drop = document.createElement('div');
        drop.classList.add('rain-drop');
        drop.classList.add(Math.random() > 0.5 ? 'red' : 'white');

        drop.style.position = 'absolute';
        drop.style.top = '-20vh';
        drop.style.width = '2px';
        drop.style.borderRadius = '2px';
        drop.style.left = Math.random() * 100 + 'vw';
        drop.style.animation = `rain-fall ${Math.random() * 1.5 + 0.5}s linear ${(Math.random() * 2)}s infinite`;
        drop.style.opacity = Math.random() * 0.5 + 0.2;
        drop.style.height = (Math.random() * 15 + 10) + 'px';

        targetContainer.appendChild(drop);
    }

    // Add CSS for rain if not present
    if (!document.getElementById('rainStyles')) {
        const style = document.createElement('style');
        style.id = 'rainStyles';
        style.textContent = `
            .rain-drop.red {
                background: rgba(178, 34, 52, 0.6);
                box-shadow: 0 0 4px rgba(178, 34, 52, 0.4);
            }
            .rain-drop.white {
                background: rgba(255, 255, 255, 0.6);
                box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
            }
            @keyframes rain-fall {
                0% { transform: translateY(0); }
                100% { transform: translateY(120vh); }
            }
        `;
        document.head.appendChild(style);
    }
})();
