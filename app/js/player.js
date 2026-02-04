import { state } from './state.js';
import * as ui from './ui.js';
import * as renderer from './renderer.js';
import { 
    btnPlayerBack, btnPlayerPlay, btnPlayerNext, btnPlayerStop, 
    btnPlayerStart, btnPlayerEnd,
    playerStepInfo, logList 
} from './dom.js';

// Configurazione Player
const PLAYBACK_SPEED = 2000;
let playbackTimer = null;

// Carica una sequenza di passi e avvia la modalità algoritmo
export function loadAlgorithm(steps) {
    state.algorithmSteps = steps;
    state.currentStepIndex = -1;
    state.playbackPaused = true;

    // Entra in modalità visualizzazione
    ui.setAlgorithmMode(true);
    updateControls();
    
    // Esegui reset visivo iniziale per sicurezza
    resetVisuals();
}

// Avvia la riproduzione automatica
export function play() {
    state.playbackPaused = false;
    updateControls();
    runAutoPlay();
}

// Mette in pausa
export function pause() {
    state.playbackPaused = true;
    if (playbackTimer) {
        clearTimeout(playbackTimer);
        playbackTimer = null;
    }
    updateControls();
}

// Interrompe tutto e torna all'editor
export function stop() {
    pause();
    state.algorithmSteps = [];
    state.currentStepIndex = -1;
    resetVisuals();
    ui.setAlgorithmMode(false);
}

// Avanza di uno step
export function next() {
    // Se siamo alla fine, non fare nulla
    if (state.currentStepIndex >= state.algorithmSteps.length - 1) {
        pause();
        return;
    }

    state.currentStepIndex++;
    const step = state.algorithmSteps[state.currentStepIndex];
    
    applyStep(step);
    addLogEntry(step, state.currentStepIndex);
    updateControls();
    
    return true; // Ha eseguito uno step
}

// Torna indietro di uno step
export function back() {
    if (state.currentStepIndex < 0) return;

    // Pausa automatica quando si naviga manualmente
    pause();

    const targetIndex = state.currentStepIndex - 1;
    
    // Reset completo
    resetVisuals();
    logList.innerHTML = '';
    state.currentStepIndex = -1;

    // Riesegui velocemente fino allo step precedente
    for (let i = 0; i <= targetIndex; i++) {
        state.currentStepIndex = i;
        const step = state.algorithmSteps[i];
        applyStep(step);
        addLogEntry(step, i);
    }
    
    updateControls();
}

// Torna all'inizio (resetta visualizzazione ma mantiene algoritmo caricato)
export function goToStart() {
    pause();
    resetVisuals();
    logList.innerHTML = '';
    state.currentStepIndex = -1;
    updateControls();
}

// Vai direttamente alla fine
export function goToEnd() {
    pause();
    const total = state.algorithmSteps.length;
    if (total === 0) return;

    // Se siamo già alla fine, inutile rifare tutto
    if (state.currentStepIndex >= total - 1) return;

    // Esegui tutto velocemente senza delay
    // Ottimizzazione: potremmo saltare il rendering intermedio, 
    // ma per semplicità e correttezza (dipendenza incrementale) rieseguiamo applyStep
    
    // Se siamo all'inizio, partiamo da 0, altrimenti continuiamo da dove siamo
    const startIndex = state.currentStepIndex + 1;
    
    for (let i = startIndex; i < total; i++) {
        state.currentStepIndex = i;
        const step = state.algorithmSteps[i];
        applyStep(step);
        addLogEntry(step, i);
    }
    
    updateControls();
}

// Loop ricorsivo per l'autoplay
function runAutoPlay() {
    if (state.playbackPaused) return;
    
    const didStep = next();
    if (didStep) {
        playbackTimer = setTimeout(runAutoPlay, PLAYBACK_SPEED);
    } else {
        pause(); // Finito
    }
}

// Applica le modifiche visive di un singolo oggetto Step
function applyStep(step) {
    // step struttura attesa: 
    // { 
    //   description: "Testo log", 
    //   changes: { 
    //      nodes: [ { id, color, algLabel, borderColor } ], 
    //      edges: [ { id, color, flow, saturated } ] 
    //   } 
    // }

    if (!step.changes) return;

    // Modifiche Nodi
    if (step.changes.nodes) {
        step.changes.nodes.forEach(change => {
            const node = state.nodes.find(n => n.id === change.id);
            if (!node) return;

            if (change.algLabel !== undefined) {
                node.algLabel = change.algLabel;
            }
            
            // Gestione Colori
            if (change.color) node.el.style.fill = change.color;
            if (change.borderColor) node.el.style.stroke = change.borderColor;
            
            // Reset Stile
            if (change.resetStyle) {
                node.el.style.fill = '';
                node.el.style.stroke = '';
            }

            renderer.updateNodeVisuals(node);
        });
    }

    // Modifiche Archi
    if (step.changes.edges) {
        step.changes.edges.forEach(change => {
            const edge = state.edges.find(e => e.id === change.id);
            if (!edge) return;

            if (change.flow !== undefined) edge.flow = change.flow;
            if (change.saturated !== undefined) edge.isSaturated = change.saturated;
            
            // Sync base visuals (labels, saturation color) first
            renderer.updateEdgeVisuals(edge);

            // Colore Temporaneo (es. evidenziato in giallo durante scansione)
            if (change.color) {
                edge.el.style.stroke = change.color;
            }

            // Larghezza Temporanea (es. evidenziato in grassetto per path finale)
            if (change.width) {
                edge.el.style.strokeWidth = change.width + "px";
            } else if (!edge.isSaturated) {
                 edge.el.style.strokeWidth = ''; 
            }
        });
    }
}

// Resetta tutto il grafo allo stato pulito
function resetVisuals() {
    state.nodes.forEach(n => {
        n.algLabel = "";
        n.el.style.fill = "";
        n.el.style.stroke = "";
        renderer.updateNodeVisuals(n);
    });

    state.edges.forEach(e => {
        e.flow = 0;
        e.isSaturated = false;
        e.el.style.stroke = "";
        renderer.updateEdgeVisuals(e);
    });
}

// Aggiunge riga al log laterale
function addLogEntry(step, index) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>Passo ${index + 1}:</strong> ${step.description}`;
    li.classList.add('current');
    
    // Rimuovi highlight dai precedenti
    const siblings = logList.querySelectorAll('li');
    siblings.forEach(s => s.classList.remove('current'));
    
    logList.appendChild(li);
    li.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// Aggiorna stato pulsanti UI
function updateControls() {
    const total = state.algorithmSteps.length;
    const currentDisplay = state.currentStepIndex + 1;
    
    playerStepInfo.textContent = `Step: ${currentDisplay} / ${total}`;
    
    // Toggle Play/Pause Icon
    const playIcon = btnPlayerPlay.querySelector('.material-symbols-outlined');
    if (playIcon) {
        playIcon.textContent = state.playbackPaused ? "play_arrow" : "pause";
    }
    
    // Se siamo all'inizio, Back disabilitato
    btnPlayerBack.disabled = state.currentStepIndex < 0;
    btnPlayerStart.disabled = state.currentStepIndex < 0;
    
    // Se siamo alla fine, Next disabilitato
    btnPlayerNext.disabled = state.currentStepIndex >= total - 1;
    btnPlayerEnd.disabled = state.currentStepIndex >= total - 1;
}

// --- EVENT LISTENERS ---
// Vengono attaccati una volta sola all'importazione del modulo

if (btnPlayerPlay) {
    btnPlayerPlay.addEventListener('click', () => {
        if (state.playbackPaused) play();
        else pause();
    });

    btnPlayerNext.addEventListener('click', () => {
        pause(); // Stop autoplay se interagisco manualmente
        next();
    });

    btnPlayerBack.addEventListener('click', () => {
        back();
    });

    btnPlayerStop.addEventListener('click', () => {
        stop();
    });

    btnPlayerStart.addEventListener('click', () => {
        goToStart();
    });

    btnPlayerEnd.addEventListener('click', () => {
        goToEnd();
    });
}
