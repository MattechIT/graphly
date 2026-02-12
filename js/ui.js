import { state } from './state.js';
import { floatingPanel, btnAddNode, btnAddEdge, svgCanvas, toastContainer, guideOverlay, btnOpenGuide } from './dom.js';
import { centerGraph } from './layout.js';
import { LABEL_MAX_LENGTH } from './config.js';

let currentToast = null;

/**
 * Shows a toast message at the bottom of the screen.
 * @param {string|null} message The message to show, or null to hide current toast.
 * @param {number} duration Duration in ms. If 0, toast is persistent.
 */
export function showToast(message, duration = 3000) {
    if (!message) {
        if (currentToast) {
            const toastToHide = currentToast;
            toastToHide.classList.add('toast-out');
            setTimeout(() => toastToHide.remove(), 300);
            currentToast = null;
        }
        return;
    }

    if (currentToast && currentToast.innerText === message) return;

    if (currentToast) {
        currentToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    
    toastContainer.appendChild(toast);
    currentToast = toast;

    if (duration > 0) {
        setTimeout(() => {
            if (currentToast === toast) {
                toast.classList.add('toast-out');
                setTimeout(() => toast.remove(), 300);
                if (currentToast === toast) currentToast = null;
            }
        }, duration);
    }
}

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
                node.userLabel = val.substring(0, LABEL_MAX_LENGTH);
                import('./renderer.js').then(r => r.updateNodeVisuals(node));
            }, LABEL_MAX_LENGTH);
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
        showToast("Click to add a new node.", 0);
        svgCanvas.style.cursor = "crosshair";
    } else if (state.currentMode === 'addEdge') {
        showToast("Drag from one node to another to connect them.", 0);
        svgCanvas.style.cursor = "pointer";
    } else if (state.currentMode === 'selectSource') {
        showToast(`Select a SOURCE node for ${state.selectedAlgorithm.name}`, 0);
        svgCanvas.style.cursor = "pointer";
    } else if (state.currentMode === 'selectSink') {
        showToast(`Select a SINK node for ${state.selectedAlgorithm.name}`, 0);
        svgCanvas.style.cursor = "pointer";
    } else {
        showToast(null);
        svgCanvas.style.cursor = "default";
    }
}

// Close panel clicking outside
document.addEventListener('mousedown', (e) => {
    if (!floatingPanel || !floatingPanel.classList.contains('visible')) return;

    const target = e.target;
    
    // Safety: If clicking inside a modal, don't do anything
    if (target.closest('.modal-overlay') || target.closest('.modal-content')) return;

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
        
        document.querySelectorAll('.node').forEach(n => {
            n.removeAttribute('data-selected');
            n.removeAttribute('data-alg-state');
        });

        document.getElementById('log-list').innerHTML = '';
        import('./renderer.js').then(r => {
             r.refreshAllEdgesVisuals();
        });
    }

    setTimeout(() => centerGraph(), 50);
}

export function handleAlgorithmClick(algorithm) {
    // Silent guard
    if (state.nodes.length === 0) return;

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
    
    // Map param name to UI mode
    if (paramName === 'sourceNode') {
        setMode('selectSource');
    } else if (paramName === 'sinkNode') {
        setMode('selectSink');
    }
}

export function handleSelection(nodeId) {
    const requiredParams = state.selectedAlgorithm.requires;
    const currentParam = requiredParams[state.selectionStep];
    
    // Prevent selecting the same node for different required parameters (e.g., Source and Sink)
    const existingValues = Object.values(state.algorithmParams);
    if (existingValues.includes(nodeId)) {
        showToast("Please select a different node!", 2000);
        setTimeout(() => updateUI(), 2000);
        return;
    }

    state.algorithmParams[currentParam] = nodeId;
    
    // Visually highlight the selected node
    const nodeEl = document.getElementById(nodeId);
    if (nodeEl) {
        nodeEl.setAttribute('data-selected', 'true');
    }
    
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
        
        if (!steps || !Array.isArray(steps) || steps.length === 0) {
            throw new Error("Algorithm returned no steps.");
        }

        import('./player.js').then(player => {
            player.loadAlgorithm(steps);
        });
    } catch (e) {
        console.error("Algorithm Execution Error:", e);
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

// Helper to manage body lock for modals
export function toggleModalState(isOpen) {
    if (isOpen) {
        document.body.classList.add('modal-open');
    } else {
        document.body.classList.remove('modal-open');
    }
}

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

// --- GUIDE MODAL LOGIC ---
let guideData = null;
async function loadGuide() {
    if (guideData) return;
    try {
        const response = await fetch('res/guide.json');
        guideData = await response.json();
        renderGuide();
    } catch (error) {
        console.error("Failed to load guide data:", error);
    }
}

function renderGuide() {
    const tabsContainer = document.getElementById('guide-tabs');
    const bodyContainer = document.getElementById('guide-body');
    if (!tabsContainer || !bodyContainer || !guideData) return;

    tabsContainer.innerHTML = '';
    bodyContainer.innerHTML = '';

    guideData.forEach((section, index) => {
        // Create Tab
        const tabBtn = document.createElement('button');
        tabBtn.className = `tab-link ${index === 0 ? 'active' : ''}`;
        tabBtn.textContent = section.label;
        tabBtn.onclick = () => switchTab(section.id);
        tabBtn.setAttribute('data-tab-id', section.id);
        tabsContainer.appendChild(tabBtn);

        // Create Content
        const contentDiv = document.createElement('div');
        contentDiv.id = section.id;
        contentDiv.className = `tab-content ${index === 0 ? 'active' : ''}`;
        
        let html = `<h4>${section.title}</h4>`;
        const listTag = section.type === 'numbered' ? 'ol' : 'ul';
        
        html += `<${listTag}>`;
        section.steps.forEach(step => {
            html += `<li>${step}</li>`;
        });
        html += `</${listTag}>`;

        if (section.image) {
            html += `<img src="${section.image}" alt="${section.label}" class="guide-image">`;
        }

        contentDiv.innerHTML = html;
        bodyContainer.appendChild(contentDiv);
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-link').forEach(l => {
        l.classList.toggle('active', l.getAttribute('data-tab-id') === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.toggle('active', c.id === tabId);
    });
}

btnOpenGuide?.addEventListener('click', async () => {
    await loadGuide();
    guideOverlay.classList.remove('hidden');
    toggleModalState(true);
});

// Close modal logic (delegated)
document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        document.getElementById(modalId)?.classList.add('hidden');
        toggleModalState(false);
    });
});
