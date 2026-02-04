import * as Dijkstra from './dijkstra.js';
import * as Kruskal from './kruskal.js';
import * as FordFulkerson from './fordFulkerson.js';

// Mappa centrale degli algoritmi disponibili
// La chiave è l'ID dell'algoritmo
export const AlgorithmRegistry = {
    [Dijkstra.metadata.id]: {
        ...Dijkstra.metadata,
        run: Dijkstra.run
    },
    [Kruskal.metadata.id]: {
        ...Kruskal.metadata,
        run: Kruskal.run
    },
    [FordFulkerson.metadata.id]: {
        ...FordFulkerson.metadata,
        run: FordFulkerson.run
    }
};

// Funzione helper per ottenere la lista ordinata (opzionale)
export function getAlgorithmList() {
    return Object.values(AlgorithmRegistry);
}
