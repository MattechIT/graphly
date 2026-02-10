import { state } from './state.js';
import { floatingPanel, infoText, btnAddNode, btnAddEdge, svgCanvas } from './dom.js';
import { centerGraph } from './layout.js';

// Shows the floating panel near the provided client coordinates
export function showFloatingPanel(clientX, clientY, type, id) {
    state.selectedElement = { type, id };

    const container = document.getElementById('graph-container');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    
    let panelX = clientX - containerRect.left + 10;
    let panelY = clientY - containerRect.top + 10;

    // Boundary checks
    if (panelX + 180 > containerRect.width) panelX = containerRect.width - 190;
    if (panelY + 150 > containerRect.height) panelY = containerRect.height - 160;

    floatingPanel.style.left = panelX + 'px';
    floatingPanel.style.top = panelY + 'px';
    floatingPanel.innerHTML = '';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'panel-title';
    titleDiv.textContent = type === 'node' ? 'Node Properties' : 'Edge Properties';
    floatingPanel.appendChild(titleDiv);
    
    if (type === 'node') {
        const node = state.nodes.find(n => n.id === id);
        if (node) {
            const row = createInputRow('Name', 'text', node.userLabel, (val) => {
                node.userLabel = val.substring(0, 2);
                import('./renderer.js').then(r => r.updateNodeVisuals(node));
            }, 2);
            floatingPanel.appendChild(row);
            
            addDeleteButton(() => import('./renderer.js').then(r => r.removeNode(id)));
        }
    } else if (type === 'edge') {
        const edge = state.edges.find(e => e.id === id);
        if (edge) {
            // Single "Value" input that sets both weight and capacity
            const rowValue = createInputRow('Value', 'number', edge.weight, (val) => {
                const num = parseInt(val, 10) || 0;
                edge.weight = num;
                edge.capacity = num;
                import('./renderer.js').then(r => r.updateEdgeVisuals(edge));
            });
            floatingPanel.appendChild(rowValue);
            
            addDeleteButton(() => import('./renderer.js').then(r => r.removeEdge(id)));
        }
    }

    floatingPanel.classList.add('visible');
    floatingPanel.setAttribute('aria-hidden', 'false');
    
    // Automatic focus on the first input
    setTimeout(() => {
        const firstInput = floatingPanel.querySelector('input');
        if (firstInput) firstInput.focus();
    }, 50);
}

function createInputRow(label, type, value, onChange, maxlength = null) {
    const container = document.createElement('div');
    container.className = 'panel-row';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    if (maxlength) input.maxLength = maxlength;
    
    input.addEventListener('input', (e) => onChange(e.target.value));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') hideFloatingPanel();
    });

    container.appendChild(labelEl);
    container.appendChild(input);
    return container;
}

function addDeleteButton(onDelete) {
    const btn = document.createElement('div');
    btn.className = 'panel-delete';
    btn.textContent = 'Delete Element';
    btn.onclick = () => {
        onDelete();
        hideFloatingPanel();
    };
    floatingPanel.appendChild(btn);
}

export function hideFloatingPanel() {
    floatingPanel.classList.remove('visible');
    floatingPanel.setAttribute('aria-hidden', 'true');
    state.selectedElement = null;
}

export function panelOptionClick(action) {
    hideFloatingPanel();
}

// Change mode (toggle)
export function setMode(mode) {
    if (state.currentMode === mode) state.currentMode = null;
    else state.currentMode = mode;
    updateUI();
}

// Update UI (buttons and cursor) based on mode
export function updateUI() {
    btnAddNode.classList.toggle('active', state.currentMode === 'addNode');
    btnAddEdge.classList.toggle('active', state.currentMode === 'addEdge');

    if (state.currentMode === 'addNode') {
        infoText.innerText = "Click to add a new node.";
        svgCanvas.style.cursor = "crosshair";
    } else if (state.currentMode === 'addEdge') {
        infoText.innerText = "Drag from one node to another to connect them.";
        svgCanvas.style.cursor = "pointer";
    } else {
        infoText.innerText = "Drag nodes to move them.";
        svgCanvas.style.cursor = "default";
    }
}

// Close panel clicking outside
document.addEventListener('mousedown', (e) => {
    if (!floatingPanel) return;
    if (!floatingPanel.classList.contains('visible')) return;

    const target = e.target;
    const clickedOnNode = target.classList && target.classList.contains('node');
    const clickedOnEdge = target.classList && (target.classList.contains('edge') || target.classList.contains('edge-hitarea'));
    const isPanelClick = floatingPanel.contains(target);

    if (!isPanelClick && !clickedOnNode && !clickedOnEdge) {
        hideFloatingPanel();
    }
});

// --- ALGORITHM GUI ---
export function toggleSidebar(show) {
    const sidebar = document.getElementById('log-sidebar');
    const btnOpen = document.getElementById('btn-open-sidebar');
    
    if (show) {
        sidebar.classList.remove('hidden');
        btnOpen.classList.add('hidden');
    } else {
        sidebar.classList.add('hidden');
        if (state.isAlgorithmRunning) {
            btnOpen.classList.remove('hidden');
        }
    }
    
    setTimeout(() => centerGraph(), 50);
}

function toggleSidebarButton(show) {
    const btnOpen = document.getElementById('btn-open-sidebar');
    if (show) btnOpen.classList.remove('hidden');
    else btnOpen.classList.add('hidden');
}

// Switch between Editor mode and Algorithm Execution mode
export function setAlgorithmMode(active) {
    state.isAlgorithmRunning = active;
    state.currentMode = null;
    updateUI();

    const toolbar = document.getElementById('toolbar');
    const playerBar = document.getElementById('player-bar');
    const logSidebar = document.getElementById('log-sidebar');

    if (active) {
        toolbar.style.display = 'none';
        playerBar.classList.remove('hidden');
        logSidebar.classList.remove('hidden');
        hideFloatingPanel();
    } else {
        toolbar.style.display = 'flex';
        playerBar.classList.add('hidden');
        logSidebar.classList.add('hidden');
        
        toggleSidebarButton(false);
        
        document.getElementById('log-list').innerHTML = '';
        import('./renderer.js').then(r => {
             r.refreshAllEdgesVisuals();
        });
    }

    setTimeout(() => centerGraph(), 50);
}

export function handleAlgorithmClick(algorithm) {
    state.selectedAlgorithm = algorithm;
    state.algorithmParams = {};

    if (algorithm.requires && algorithm.requires.length > 0) {
        startSelectionStep(0);
    } else {
        runAlgorithm({});
    }
}

function startSelectionStep(stepIndex) {
    const paramName = state.selectedAlgorithm.requires[stepIndex];
    state.selectionStep = stepIndex;
    
    // Map param name to UI mode and message
    if (paramName === 'sourceNode') {
        setMode('selectSource');
        infoText.innerText = `Select a SOURCE node for ${state.selectedAlgorithm.name}`;
    } else if (paramName === 'sinkNode') {
        setMode('selectSink');
        infoText.innerText = `Select a SINK node for ${state.selectedAlgorithm.name}`;
    }
    
    svgCanvas.style.cursor = "pointer";
}

export function handleSelection(nodeId) {
    const requiredParams = state.selectedAlgorithm.requires;
    const currentParam = requiredParams[state.selectionStep];
    
    state.algorithmParams[currentParam] = nodeId;
    
    // Check if more steps are needed
    if (state.selectionStep + 1 < requiredParams.length) {
        startSelectionStep(state.selectionStep + 1);
    } else {
        runAlgorithm(state.algorithmParams);
    }
}

export function runAlgorithm(params) {
    if (!state.selectedAlgorithm) return;
    setAlgorithmMode(true);
    state.currentMode = null;

    // Deep copy of data to avoid accidental direct modifications
    const nodesCopy = JSON.parse(JSON.stringify(state.nodes));
    const edgesCopy = JSON.parse(JSON.stringify(state.edges));

    try {
        const steps = state.selectedAlgorithm.run(nodesCopy, edgesCopy, params);
        
        import('./player.js').then(player => {
            player.loadAlgorithm(steps);
        });
    } catch (e) {
        console.error("Algorithm error:", e);
        alert("Error running algorithm: " + e.message);
        setAlgorithmMode(false);
    }
}

// Handle sidebar close button click
document.getElementById('btn-close-sidebar')?.addEventListener('click', () => {
    toggleSidebar(false);
});

document.getElementById('btn-open-sidebar')?.addEventListener('click', () => {
    toggleSidebar(true);
});

/**
 * Automatically initializes all dropdown menus in the toolbar.
 * Handles exclusive opening (closing others) and click-outside to close.
 */
export function initDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const btn = dropdown.querySelector('button');
        const content = dropdown.querySelector('.dropdown-content');
        
        if (!btn || !content) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            document.querySelectorAll('.dropdown-content').forEach(otherContent => {
                if (otherContent !== content) otherContent.classList.remove('show');
            });

            content.classList.toggle('show');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-content').forEach(c => c.classList.remove('show'));
    });
}