/**
 * Entry point: Initializes modules and centralizes event handling.
 */
import * as ui from './ui.js';
import * as interactions from './interactions.js';
import * as persistence from './persistence.js';
import * as layout from './layout.js';
import { 
    btnAddNode, btnAddEdge, 
    btnSaveJson, btnSaveText, btnLoadJson, btnLoadText, inputLoadFile,
    btnLayoutLayered, btnLayoutCompact, btnLayoutCircle, btnLayoutGrid,
    algorithmContainer, importOverlay, exportOverlay, btnQuickGenerate,
    textareaNodes, textareaEdges, importStatus, textareaExportAll, btnCopyExport,
    btnLoadTestGraph
} from './dom.js';
import { getAlgorithmList } from './algorithms/registry.js';
import { centerGraph, throttle } from './layout.js';
import { THROTTLE_DELAY } from './config.js';

// --- INITIALIZATION ---
window.setMode = ui.setMode;
interactions.init();
ui.initDropdowns();
ui.updateUI();

// Optimized Window Resize Handling
window.addEventListener('resize', throttle(() => {
    // Completely skip resize logic if any modal is open to prevent mobile keyboard glitches
    if (!importOverlay.classList.contains('hidden') || !exportOverlay.classList.contains('hidden')) return;
    centerGraph();
}, THROTTLE_DELAY));

// --- FEATURE: EDITOR CONTROLS ---
btnAddNode.addEventListener('click', () => ui.setMode('addNode'));
btnAddEdge.addEventListener('click', () => ui.setMode('addEdge'));

// --- FEATURE: FILE PERSISTENCE (JSON) ---
const closeAllDropdowns = () => {
    document.querySelectorAll('.dropdown-content').forEach(c => c.classList.remove('show'));
};

btnSaveJson.addEventListener('click', () => {
    persistence.exportGraph();
    closeAllDropdowns();
});

btnLoadJson.addEventListener('click', () => {
    inputLoadFile.click();
    closeAllDropdowns();
});

inputLoadFile.addEventListener('change', (e) => {
    persistence.importGraph(e.target.files[0]);
    e.target.value = '';
});

// --- FEATURE: QUICK TEXT EDIT (IMPORT/EXPORT) ---

// Open Import Modal
btnLoadText.addEventListener('click', () => {
    const data = persistence.exportToText();
    textareaNodes.value = data.nodes;
    textareaEdges.value = data.edges;
    updateImportStatus();
    importOverlay.classList.remove('hidden');
});

// Open Export Modal
btnSaveText.addEventListener('click', () => {
    const data = persistence.exportToText();
    textareaExportAll.value = `NODES:\n${data.nodes}\n\nEDGES:\n${data.edges}`;
    exportOverlay.classList.remove('hidden');
});

// Live Import Parser Feedback
const updateImportStatus = () => {
    const nodes = textareaNodes.value.split(/[,\s\n]+/).filter(s => s.trim().length > 0).length;
    const edges = textareaEdges.value.split('\n').filter(l => l.trim().length > 0).length;
    importStatus.textContent = `Detected: ${nodes} nodes, ${edges} edges`;
};

textareaNodes.addEventListener('input', updateImportStatus);
textareaEdges.addEventListener('input', updateImportStatus);

// Generate Graph from Text
btnQuickGenerate.addEventListener('click', () => {
    persistence.generateGraphFromText(textareaNodes.value, textareaEdges.value);
    importOverlay.classList.add('hidden');
});

// Load Test Graph from res/test-graph.json
btnLoadTestGraph.addEventListener('click', async () => {
    try {
        const response = await fetch('res/test-graph.json');
        const data = await response.json();
        persistence.loadGraphData(data);
        importOverlay.classList.add('hidden');
    } catch (err) {
        console.error("Failed to load test graph:", err);
    }
});

// Clipboard functionality
btnCopyExport.addEventListener('click', () => {
    navigator.clipboard.writeText(textareaExportAll.value).then(() => {
        btnCopyExport.textContent = 'Copied!';
        setTimeout(() => { btnCopyExport.textContent = 'Copy to Clipboard'; }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        textareaExportAll.select();
    });
});

// General Modal Closing Logic
document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        document.getElementById(modalId).classList.add('hidden');
    });
});

// --- FEATURE: GRAPH LAYOUTS ---
const handleLayoutClick = (layoutFunc) => {
    layoutFunc();
    // Close any open dropdowns after selection
    document.querySelectorAll('.dropdown-content').forEach(c => c.classList.remove('show'));
};

btnLayoutLayered.addEventListener('click', () => handleLayoutClick(layout.applyLayeredLayout));
btnLayoutCompact.addEventListener('click', () => handleLayoutClick(layout.applyCompactLayout));
btnLayoutCircle.addEventListener('click', () => handleLayoutClick(layout.applyCircleLayout));
btnLayoutGrid.addEventListener('click', () => handleLayoutClick(layout.applyGridLayout));

// --- FEATURE: ALGORITHM EXECUTION ---
const algorithms = getAlgorithmList();
algorithms.forEach(algo => {
    const btn = document.createElement('button');
    btn.className = 'btn-dropdown-item';
    btn.type = 'button';
    
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
        ui.handleAlgorithmClick(algo); 
        algorithmContainer.classList.remove('show');
    });
    
    algorithmContainer.appendChild(btn);
});
