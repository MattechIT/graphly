// Entry point: importa i moduli e inizializza l'app
import { state } from './state.js';
import * as ui from './ui.js';
import * as renderer from './renderer.js';
import * as interactions from './interactions.js';
import * as player from './player.js';
import * as persistence from './persistence.js';
import * as layout from './layout.js';
import { 
    btnAddNode, btnAddEdge, 
    btnSave, btnLoad, inputLoadFile,
    btnLayoutLayered, btnLayoutCompact, btnLayoutCircle, btnLayoutGrid,
    algorithmContainer
} from './dom.js';
import { getAlgorithmList } from './algorithms/registry.js';
import { centerGraph } from './layout.js';

// Esponi funzioni globali
window.setMode = ui.setMode;

// Inizializza i listener globali
interactions.init();

// Gestione Resize Finestra
window.addEventListener('resize', () => {
    centerGraph();
});

// Aggiorna l'UI iniziale
ui.updateUI();

// Controlli Toolbar
btnAddNode.addEventListener('click', () => ui.setMode('addNode'));
btnAddEdge.addEventListener('click', () => ui.setMode('addEdge'));

// Controlli Persistenza
btnSave.addEventListener('click', () => persistence.exportGraph());
btnLoad.addEventListener('click', () => inputLoadFile.click());

// Controlli Layout
const btnLayoutMenu = document.getElementById('btn-layout-menu');
const layoutDropdown = document.getElementById('layout-dropdown');
const btnAlgoMenu = document.getElementById('btn-algo-menu');

// Toggle Dropdowns
btnLayoutMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    layoutDropdown.classList.toggle('show');
    algorithmContainer.classList.remove('show');
});

btnAlgoMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    algorithmContainer.classList.toggle('show');
    layoutDropdown.classList.remove('show');
});

// Close dropdowns on click outside
document.addEventListener('click', () => {
    layoutDropdown.classList.remove('show');
    algorithmContainer.classList.remove('show');
});

const handleLayoutClick = (layoutFunc) => {
    layoutFunc();
    layoutDropdown.classList.remove('show');
};

btnLayoutLayered.addEventListener('click', () => handleLayoutClick(layout.applyLayeredLayout));
btnLayoutCompact.addEventListener('click', () => handleLayoutClick(layout.applyCompactLayout));
btnLayoutCircle.addEventListener('click', () => handleLayoutClick(layout.applyCircleLayout));
btnLayoutGrid.addEventListener('click', () => handleLayoutClick(layout.applyGridLayout));

inputLoadFile.addEventListener('change', (e) => {
    persistence.importGraph(e.target.files[0]);
    e.target.value = '';
});

// Generazione Dinamica Pulsanti Algoritmi
const algorithms = getAlgorithmList();
algorithms.forEach(algo => {
    const btn = document.createElement('button');
    btn.className = 'btn-dropdown-item'; // Classe aggiornata
    btn.type = 'button';
    
    // Icona opzionale basata sul tipo di algoritmo
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
        algorithmContainer.classList.remove('show');
    });
    
    algorithmContainer.appendChild(btn);
});
