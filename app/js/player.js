import { state } from './state.js';
import * as ui from './ui.js';
import * as renderer from './renderer.js';
import { 
    btnPlayerBack, btnPlayerPlay, btnPlayerNext, btnPlayerStop, 
    btnPlayerStart, btnPlayerEnd,
    playerStepInfo, logList 
} from './dom.js';

// Player Configuration
const PLAYBACK_SPEED = 2000;
let playbackTimer = null;

// Loads an algorithm sequence and starts algorithm mode
export function loadAlgorithm(steps) {
    state.algorithmSteps = steps;
    state.currentStepIndex = -1;
    state.playbackPaused = true;

    // Enter visualization mode
    ui.setAlgorithmMode(true);
    updateControls();
    
    // Initial visual reset for safety
    resetVisuals();
}

// Starts auto-playback
export function play() {
    state.playbackPaused = false;
    updateControls();
    runAutoPlay();
}

// Pauses playback
export function pause() {
    state.playbackPaused = true;
    if (playbackTimer) {
        clearTimeout(playbackTimer);
        playbackTimer = null;
    }
    updateControls();
}

// Stops algorithm mode and returns to editor
export function stop() {
    pause();
    state.algorithmSteps = [];
    state.currentStepIndex = -1;
    resetVisuals();
    ui.setAlgorithmMode(false);
}

// Advances by one step
export function next() {
    // If at the end, do nothing
    if (state.currentStepIndex >= state.algorithmSteps.length - 1) {
        pause();
        return;
    }

    state.currentStepIndex++;
    const step = state.algorithmSteps[state.currentStepIndex];
    
    applyStep(step);
    addLogEntry(step, state.currentStepIndex);
    updateControls();
    
    return true; // Successfully performed a step
}

// Goes back by one step
export function back() {
    if (state.currentStepIndex < 0) return;

    // Auto-pause when navigating manually
    pause();

    const targetIndex = state.currentStepIndex - 1;
    
    // Full reset
    resetVisuals();
    logList.innerHTML = '';
    state.currentStepIndex = -1;

    // Re-execute quickly up to the previous step
    for (let i = 0; i <= targetIndex; i++) {
        state.currentStepIndex = i;
        const step = state.algorithmSteps[i];
        applyStep(step);
        addLogEntry(step, i);
    }
    
    updateControls();
}

// Goes to the start (resets visualization but keeps algorithm loaded)
export function goToStart() {
    pause();
    resetVisuals();
    logList.innerHTML = '';
    state.currentStepIndex = -1;
    updateControls();
}

// Goes directly to the end
export function goToEnd() {
    pause();
    const total = state.algorithmSteps.length;
    if (total === 0) return;

    // If already at the end, do nothing
    if (state.currentStepIndex >= total - 1) return;

    // Execute everything quickly without delay
    const startIndex = state.currentStepIndex + 1;
    
    for (let i = startIndex; i < total; i++) {
        state.currentStepIndex = i;
        const step = state.algorithmSteps[i];
        applyStep(step);
        addLogEntry(step, i);
    }
    
    updateControls();
}

// Recursive loop for autoplay
function runAutoPlay() {
    if (state.playbackPaused) return;
    
    const didStep = next();
    if (didStep) {
        playbackTimer = setTimeout(runAutoPlay, PLAYBACK_SPEED);
    } else {
        pause(); // Finished
    }
}

// Applies visual changes from a single Step object
function applyStep(step) {
    if (!step.changes) return;

    // Node changes
    if (step.changes.nodes) {
        step.changes.nodes.forEach(change => {
            const node = state.nodes.find(n => n.id === change.id);
            if (!node) return;

            if (change.algLabel !== undefined) {
                node.algLabel = change.algLabel;
            }
            
            // State Management via Data Attributes
            if (change.state) {
                node.el.dataset.algState = change.state;
            }
            
            // Style Reset
            if (change.resetStyle) {
                delete node.el.dataset.algState;
            }

            renderer.updateNodeVisuals(node);
        });
    }

    // Edge changes
    if (step.changes.edges) {
        step.changes.edges.forEach(change => {
            const edge = state.edges.find(e => e.id === change.id);
            if (!edge) return;

            if (change.flow !== undefined) edge.flow = change.flow;
            if (change.saturated !== undefined) edge.isSaturated = change.saturated;
            
            // State Management via Data Attributes
            if (change.state) {
                edge.el.dataset.algState = change.state;
            }

            // Style Reset
            if (change.resetStyle) {
                delete edge.el.dataset.algState;
            }

            // Sync base visuals (labels, markers)
            renderer.updateEdgeVisuals(edge);

            // Temporary Width (e.g., bold for final path)
            if (change.width) {
                edge.el.style.strokeWidth = change.width + "px";
            }
        });
    }
}

// Resets the entire graph to a clean state
function resetVisuals() {
    state.nodes.forEach(n => {
        n.algLabel = "";
        delete n.el.dataset.algState;
        renderer.updateNodeVisuals(n);
    });

    state.edges.forEach(e => {
        e.flow = 0;
        e.isSaturated = false;
        delete e.el.dataset.algState;
        delete e.el.dataset.isSaturated;
        e.el.style.strokeWidth = "";
        renderer.updateEdgeVisuals(e);
    });
}

// Adds a row to the sidebar log
function addLogEntry(step, index) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>Step ${index + 1}:</strong> ${step.description}`;
    li.classList.add('current');
    
    // Remove highlight from previous entries
    const siblings = logList.querySelectorAll('li');
    siblings.forEach(s => s.classList.remove('current'));
    
    logList.appendChild(li);
    li.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// Updates UI button states
function updateControls() {
    const total = state.algorithmSteps.length;
    const currentDisplay = state.currentStepIndex + 1;
    
    playerStepInfo.textContent = `Step: ${currentDisplay} / ${total}`;
    
    // Toggle Play/Pause Icon
    const playIcon = btnPlayerPlay.querySelector('.material-symbols-outlined');
    if (playIcon) {
        playIcon.textContent = state.playbackPaused ? "play_arrow" : "pause";
    }
    
    // If at the start, Disable Back
    btnPlayerBack.disabled = state.currentStepIndex < 0;
    btnPlayerStart.disabled = state.currentStepIndex < 0;
    
    // If at the end, Disable Next
    btnPlayerNext.disabled = state.currentStepIndex >= total - 1;
    btnPlayerEnd.disabled = state.currentStepIndex >= total - 1;
}

// --- EVENT LISTENERS ---
// Attached once during module import

if (btnPlayerPlay) {
    btnPlayerPlay.addEventListener('click', () => {
        if (state.playbackPaused) play();
        else pause();
    });

    btnPlayerNext.addEventListener('click', () => {
        pause(); // Stop autoplay if interacting manually
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