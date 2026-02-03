// Entry point: importa i moduli e inizializza l'app
import { state } from './state.js';
import * as ui from './ui.js';
import * as renderer from './renderer.js';
import * as interactions from './interactions.js';
import * as player from './player.js';
import { 
    btnAddNode, btnAddEdge, 
    btnDijkstra, btnKruskal, btnFordFulkerson,
    btnTestPlayer
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

// TEST PLAYER LOGIC
btnTestPlayer.addEventListener('click', () => {
    if (state.nodes.length < 2) {
        alert("Crea almeno 2 nodi per testare il player.");
        return;
    }

    const n1 = state.nodes[0];
    const n2 = state.nodes[1];
    // Cerca un arco tra n1 e n2 (o viceversa)
    const edge = state.edges.find(e => (e.source === n1.id && e.target === n2.id) || (e.source === n2.id && e.target === n1.id));
    const edgeId = edge ? edge.id : null;

    const steps = [
        {
            description: `Inizio simulazione. Selezionato nodo ${n1.userLabel}.`,
            changes: {
                nodes: [ { id: n1.id, color: '#f1c40f', algLabel: 'Start' } ]
            }
        },
        {
            description: `Calcolo distanza verso ${n2.userLabel}.`,
            changes: {
                nodes: [ 
                    { id: n1.id, color: '#2ecc71', algLabel: 'Vis' },
                    { id: n2.id, color: '#e67e22', algLabel: '?' } 
                ],
                edges: edgeId ? [ { id: edgeId, color: '#e67e22' } ] : []
            }
        },
        {
            description: edgeId ? "Flusso inviato sull'arco." : "Nessun arco trovato.",
            changes: {
                nodes: [ { id: n2.id, algLabel: 'dist: 5' } ],
                edges: edgeId ? [ { id: edgeId, flow: 5, color: '#3498db' } ] : []
            }
        },
        {
            description: "Fine test. Saturazione arco.",
            changes: {
                edges: edgeId ? [ { id: edgeId, saturated: true } ] : []
            }
        }
    ];

    player.loadAlgorithm(steps);
});
