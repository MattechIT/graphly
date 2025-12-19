import { state } from './state.js';
import { floatingPanel, infoText, btnAddNode, btnAddEdge, svgCanvas } from './dom.js';

// Mostra il pannello flottante vicino alle coordinate client fornite
export function showFloatingPanel(clientX, clientY, type, id) {
    state.selectedElement = { type, id };

    const containerRect = document.getElementById('graph-container').getBoundingClientRect();
    let panelX = clientX - containerRect.left + 10;
    let panelY = clientY - containerRect.top + 10;

    floatingPanel.style.left = panelX + 'px';
    floatingPanel.style.top = panelY + 'px';
    floatingPanel.classList.add('visible');

    const titleEl = floatingPanel.querySelector('.panel-title');
    titleEl.textContent = type === 'node' ? `Nodo: ${id}` : `Arco: ${id}`;
}

export function hideFloatingPanel() {
    floatingPanel.classList.remove('visible');
    state.selectedElement = null;
}

export function panelOptionClick(optionNum) {
    if (state.selectedElement) {
        console.log(`Opzione ${optionNum} selezionata per ${state.selectedElement.type}: ${state.selectedElement.id}`);
    }
    hideFloatingPanel();
}

// Cambia la modalità (toggle)
export function setMode(mode) {
    if (state.currentMode === mode) state.currentMode = null;
    else state.currentMode = mode;
    updateUI();
}

// Aggiorna UI (pulsanti e cursore) in base alla modalità
export function updateUI() {
    btnAddNode.classList.toggle('active', state.currentMode === 'addNode');
    btnAddEdge.classList.toggle('active', state.currentMode === 'addEdge');

    if (state.currentMode === 'addNode') {
        infoText.innerText = "Clicca per creare un nodo.";
        svgCanvas.style.cursor = "crosshair";
    } else if (state.currentMode === 'addEdge') {
        infoText.innerText = "Trascina da un nodo all'altro per collegarli.";
        svgCanvas.style.cursor = "pointer";
    } else {
        infoText.innerText = "Trascina i nodi per spostarli.";
        svgCanvas.style.cursor = "default";
    }
}

// Chiudi pannello cliccando fuori (gestione globale per comodità)
document.addEventListener('mousedown', (e) => {
    // Se il pannello non è visibile, non fare nulla
    if (!floatingPanel) return;
    if (!floatingPanel.classList.contains('visible')) return;

    const target = e.target;
    const clickedOnNode = target.classList && target.classList.contains('node');
    const clickedOnEdge = target.classList && (target.classList.contains('edge') || target.classList.contains('edge-hitarea'));

    if (!floatingPanel.contains(target) && !clickedOnNode && !clickedOnEdge) {
        hideFloatingPanel();
    }
});
