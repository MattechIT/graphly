// Entry point: importa i moduli e inizializza l'app
import { state } from './state.js';
import * as ui from './ui.js';
import * as renderer from './renderer.js';
import * as interactions from './interactions.js';
import { 
    btnAddNode, btnAddEdge, 
    btnDijkstra, btnKruskal, btnFordFulkerson 
} from './dom.js';

// Esponi funzioni globali
window.setMode = ui.setMode;

// Inizializza i listener globali
interactions.init();

// Aggiorna l'UI iniziale
ui.updateUI();

// Controlli Toolbar
btnAddNode.addEventListener('click', () => ui.setMode('addNode'));
btnAddEdge.addEventListener('click', () => ui.setMode('addEdge'));

// Pulsanti Algoritmi (Logica da implementare)
btnDijkstra.addEventListener('click', () => {
    console.log("Dijkstra clicked");
});
btnKruskal.addEventListener('click', () => {
    console.log("Kruskal clicked");
});
btnFordFulkerson.addEventListener('click', () => {
    console.log("Ford-Fulkerson clicked");
});
