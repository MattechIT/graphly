// Entry point: importa i moduli e inizializza l'app
import { state } from './state.js';
import * as ui from './ui.js';
import * as renderer from './renderer.js';
import * as interactions from './interactions.js';
import { btnAddNode, btnAddEdge } from './dom.js';

// Esponi alcune funzioni a livello globale per mantenere compatibilità
// con gli attributi inline `onclick="setMode('addNode')"` presenti in HTML
window.setMode = ui.setMode;
window.panelOptionClick = ui.panelOptionClick;

// Inizializza i listener globali
interactions.init();

// Aggiorna l'UI iniziale
ui.updateUI();

// Wired UI controls (toolbar buttons and floating panel options)
btnAddNode.addEventListener('click', () => ui.setMode('addNode'));
btnAddEdge.addEventListener('click', () => ui.setMode('addEdge'));

document.querySelectorAll('.panel-option').forEach((el) => {
	el.addEventListener('click', () => ui.panelOptionClick(el.dataset.option));
	el.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			ui.panelOptionClick(el.dataset.option);
		}
	});
});

// Se vuoi, puoi pre-creare un nodo di esempio per test rapido
// const n = renderer.createNode(100, 100);
// interactions.attachNodeListeners(n);
