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
btnLayoutLayered.addEventListener('click', () => layout.applyLayeredLayout());
btnLayoutCompact.addEventListener('click', () => layout.applyCompactLayout());
btnLayoutCircle.addEventListener('click', () => layout.applyCircleLayout());
btnLayoutGrid.addEventListener('click', () => layout.applyGridLayout());

inputLoadFile.addEventListener('change', (e) => {
    persistence.importGraph(e.target.files[0]);
    e.target.value = '';
});

// Generazione Dinamica Pulsanti Algoritmi
const algorithms = getAlgorithmList();
algorithms.forEach(algo => {
    const btn = document.createElement('button');
    btn.className = 'btn-alg';
    btn.type = 'button';
    btn.textContent = algo.name;
    btn.id = `btn-${algo.id}`;
    
    btn.addEventListener('click', () => {
        console.log(`Selected algorithm: ${algo.name}`);
        ui.handleAlgorithmClick(algo); 
    });
    
    algorithmContainer.appendChild(btn);
});

