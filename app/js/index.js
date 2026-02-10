// Entry point: imports modules and initializes the app
import { state } from './state.js';
import * as ui from './ui.js';
import * as renderer from './renderer.js';
import * as interactions from './interactions.js';
import * as player from './player.js';
import * as persistence from './persistence.js';
import * as layout from './layout.js';
import { 
    btnAddNode, btnAddEdge, 
    btnSaveJson, btnSaveText, btnLoadJson, btnLoadText, inputLoadFile,
    btnLayoutLayered, btnLayoutCompact, btnLayoutCircle, btnLayoutGrid,
    algorithmContainer, modalOverlay, btnCloseModal, btnQuickGenerate
} from './dom.js';
import { getAlgorithmList } from './algorithms/registry.js';
import { centerGraph, throttle } from './layout.js';

// Expose global functions
window.setMode = ui.setMode;

// Initialize global interaction listeners
interactions.init();

// Initialize automated UI components
ui.initDropdowns();

// Optimized Window Resize Handling
window.addEventListener('resize', throttle(() => {
    centerGraph();
}, 100));

// Initial UI Update
ui.updateUI();

// Toolbar Controls
btnAddNode.addEventListener('click', () => ui.setMode('addNode'));
btnAddEdge.addEventListener('click', () => ui.setMode('addEdge'));

// Persistence Controls
btnSaveJson.addEventListener('click', () => persistence.exportGraph());
btnLoadJson.addEventListener('click', () => inputLoadFile.click());

// Quick Edit Modal Controls
btnLoadText.addEventListener('click', () => {
    modalOverlay.classList.remove('hidden');
    // We could pre-fill textareaNodes and textareaEdges with current graph here later
});

btnCloseModal.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
});

// Close modal clicking on overlay
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
});

// Layout Controls
const handleLayoutClick = (layoutFunc) => {
    layoutFunc();
    // Dropdowns are now handled centrally for opening/closing, 
    // but we still want to close it after a selection
    document.querySelectorAll('.dropdown-content').forEach(c => c.classList.remove('show'));
};

btnLayoutLayered.addEventListener('click', () => handleLayoutClick(layout.applyLayeredLayout));
btnLayoutCompact.addEventListener('click', () => handleLayoutClick(layout.applyCompactLayout));
btnLayoutCircle.addEventListener('click', () => handleLayoutClick(layout.applyCircleLayout));
btnLayoutGrid.addEventListener('click', () => handleLayoutClick(layout.applyGridLayout));

inputLoadFile.addEventListener('change', (e) => {
    persistence.importGraph(e.target.files[0]);
    e.target.value = '';
});

// Dynamic Algorithm Button Generation
const algorithms = getAlgorithmList();
algorithms.forEach(algo => {
    const btn = document.createElement('button');
    btn.className = 'btn-dropdown-item';
    btn.type = 'button';
    
    // Optional icon based on algorithm type
    let icon = 'function';
    if (algo.id === 'dijkstra') icon = 'route';
    if (algo.id === 'kruskal') icon = 'account_tree';
    if (algo.id === 'ford-fulkerson') icon = 'water_drop';

    btn.innerHTML = `
        <span class="material-symbols-outlined">${icon}</span>
        <span class="btn-text">${algo.name}</span>
    `;
    btn.id = `btn-${algo.id}`;
    
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log(`Selected algorithm: ${algo.name}`);
        ui.handleAlgorithmClick(algo); 
        // Close dropdown after selection
        algorithmContainer.classList.remove('show');
    });
    
    algorithmContainer.appendChild(btn);
});
