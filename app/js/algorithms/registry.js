import * as Dijkstra from './dijkstra.js';

// Mappa centrale degli algoritmi disponibili
// La chiave è l'ID dell'algoritmo
export const AlgorithmRegistry = {
    [Dijkstra.metadata.id]: {
        ...Dijkstra.metadata,
        run: Dijkstra.run
    }
};

// Funzione helper per ottenere la lista ordinata (opzionale)
export function getAlgorithmList() {
    return Object.values(AlgorithmRegistry);
}
