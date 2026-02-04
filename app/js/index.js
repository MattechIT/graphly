// Entry point: importa i moduli e inizializza l'app
import { state } from './state.js';
import * as ui from './ui.js';
import * as renderer from './renderer.js';
import * as interactions from './interactions.js';
import * as player from './player.js';
import { 
    btnAddNode, btnAddEdge, 
    algorithmContainer
} from './dom.js';
import { getAlgorithmList } from './algorithms/registry.js';

// Esponi funzioni globali
window.setMode = ui.setMode;

// Inizializza i listener globali
interactions.init();

// Aggiorna l'UI iniziale
ui.updateUI();

// Controlli Toolbar
btnAddNode.addEventListener('click', () => ui.setMode('addNode'));
btnAddEdge.addEventListener('click', () => ui.setMode('addEdge'));

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

