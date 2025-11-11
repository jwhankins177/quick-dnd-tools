// State management
let characters = [];
let initiatives = [];
let currentEditingCharacterId = null;

// Load data from localStorage on startup
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderCharacters();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // Character management
    document.getElementById('add-character-btn').addEventListener('click', openCharacterModal);
    document.getElementById('character-form').addEventListener('submit', saveCharacter);
    document.getElementById('cancel-btn').addEventListener('click', closeCharacterModal);
    document.querySelector('.close').addEventListener('click', closeCharacterModal);

    // Dice roller
    document.querySelectorAll('.dice-btn').forEach(button => {
        button.addEventListener('click', () => rollDice(button.dataset.dice));
    });
    document.getElementById('custom-roll-btn').addEventListener('click', rollCustomDice);
    document.getElementById('custom-dice').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') rollCustomDice();
    });

    // Initiative tracker
    document.getElementById('add-initiative-btn').addEventListener('click', addInitiative);
    document.getElementById('init-value').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addInitiative();
    });
    document.getElementById('clear-initiative-btn').addEventListener('click', clearInitiatives);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('character-modal');
        if (e.target === modal) closeCharacterModal();
    });
}

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Local Storage Management
function saveData() {
    localStorage.setItem('dnd-characters', JSON.stringify(characters));
    localStorage.setItem('dnd-initiatives', JSON.stringify(initiatives));
}

function loadData() {
    const savedCharacters = localStorage.getItem('dnd-characters');
    const savedInitiatives = localStorage.getItem('dnd-initiatives');

    if (savedCharacters) {
        characters = JSON.parse(savedCharacters);
    }

    if (savedInitiatives) {
        initiatives = JSON.parse(savedInitiatives);
        renderInitiatives();
    }
}

// Character Management
function openCharacterModal(characterId = null) {
    const modal = document.getElementById('character-modal');
    const form = document.getElementById('character-form');
    const title = document.getElementById('modal-title');

    form.reset();
    currentEditingCharacterId = characterId;

    if (characterId !== null) {
        title.textContent = 'Edit Character';
        const character = characters.find(c => c.id === characterId);
        if (character) {
            document.getElementById('char-name').value = character.name;
            document.getElementById('char-class').value = character.class;
            document.getElementById('char-level').value = character.level;
            document.getElementById('char-max-hp').value = character.maxHp;
            document.getElementById('char-current-hp').value = character.currentHp;
            document.getElementById('char-ac').value = character.ac;
        }
    } else {
        title.textContent = 'Add Character';
    }

    modal.classList.add('show');
}

function closeCharacterModal() {
    const modal = document.getElementById('character-modal');
    modal.classList.remove('show');
    currentEditingCharacterId = null;
}

function saveCharacter(e) {
    e.preventDefault();

    const characterData = {
        name: document.getElementById('char-name').value,
        class: document.getElementById('char-class').value,
        level: parseInt(document.getElementById('char-level').value),
        maxHp: parseInt(document.getElementById('char-max-hp').value),
        currentHp: parseInt(document.getElementById('char-current-hp').value),
        ac: parseInt(document.getElementById('char-ac').value)
    };

    if (currentEditingCharacterId !== null) {
        // Update existing character
        const index = characters.findIndex(c => c.id === currentEditingCharacterId);
        if (index !== -1) {
            characters[index] = { ...characters[index], ...characterData };
        }
    } else {
        // Add new character
        characterData.id = Date.now();
        characters.push(characterData);
    }

    saveData();
    renderCharacters();
    closeCharacterModal();
}

function deleteCharacter(id) {
    if (confirm('Are you sure you want to delete this character?')) {
        characters = characters.filter(c => c.id !== id);
        saveData();
        renderCharacters();
    }
}

function renderCharacters() {
    const container = document.getElementById('characters-list');

    if (characters.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No characters yet. Add your first character to get started!</p></div>';
        return;
    }

    container.innerHTML = characters.map(character => {
        const hpPercentage = (character.currentHp / character.maxHp) * 100;
        let hpClass = '';
        if (hpPercentage <= 25) hpClass = 'critical';
        else if (hpPercentage <= 50) hpClass = 'low';

        return `
            <div class="character-card">
                <div class="character-header">
                    <div>
                        <div class="character-name">${character.name}</div>
                        <div class="character-class-level">${character.class} - Level ${character.level}</div>
                    </div>
                </div>
                <div class="character-stats">
                    <div class="stat-item">
                        <div class="stat-label">AC</div>
                        <div class="stat-value">${character.ac}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Level</div>
                        <div class="stat-value">${character.level}</div>
                    </div>
                </div>
                <div class="hp-bar-container">
                    <div class="hp-bar">
                        <div class="hp-bar-fill ${hpClass}" style="width: ${hpPercentage}%"></div>
                    </div>
                    <div class="hp-text">${character.currentHp} / ${character.maxHp} HP</div>
                </div>
                <div class="character-actions">
                    <button class="btn-edit" onclick="openCharacterModal(${character.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteCharacter(${character.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Dice Roller
function rollDice(diceType) {
    const sides = parseInt(diceType.substring(1));
    const result = Math.floor(Math.random() * sides) + 1;

    displayDiceResult(diceType, result);
}

function rollCustomDice() {
    const input = document.getElementById('custom-dice').value.trim();
    if (!input) return;

    // Parse dice notation (e.g., 2d6+3, d20, 3d8-2)
    const match = input.match(/^(\d+)?d(\d+)([\+\-]\d+)?$/i);

    if (!match) {
        alert('Invalid dice notation. Use format like: d20, 2d6, 3d8+2');
        return;
    }

    const count = parseInt(match[1] || '1');
    const sides = parseInt(match[2]);
    const modifier = parseInt(match[3] || '0');

    const rolls = [];
    let total = 0;

    for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        rolls.push(roll);
        total += roll;
    }

    total += modifier;

    displayDiceResult(
        input,
        total,
        `Rolls: [${rolls.join(', ')}]${modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : ''}`
    );

    document.getElementById('custom-dice').value = '';
}

function displayDiceResult(diceType, result, details = '') {
    const container = document.getElementById('dice-results');
    const resultElement = document.createElement('div');
    resultElement.className = 'dice-result';

    resultElement.innerHTML = `
        <div class="dice-result-header">${diceType}</div>
        <div class="dice-result-value">${result}</div>
        ${details ? `<div class="dice-result-details">${details}</div>` : ''}
    `;

    container.insertBefore(resultElement, container.firstChild);

    // Keep only last 10 results
    while (container.children.length > 10) {
        container.removeChild(container.lastChild);
    }
}

// Initiative Tracker
function addInitiative() {
    const nameInput = document.getElementById('init-name');
    const valueInput = document.getElementById('init-value');

    const name = nameInput.value.trim();
    const value = parseInt(valueInput.value);

    if (!name || isNaN(value)) {
        alert('Please enter both name and initiative value');
        return;
    }

    initiatives.push({
        id: Date.now(),
        name: name,
        value: value
    });

    // Sort by initiative value (highest first)
    initiatives.sort((a, b) => b.value - a.value);

    saveData();
    renderInitiatives();

    nameInput.value = '';
    valueInput.value = '';
    nameInput.focus();
}

function removeInitiative(id) {
    initiatives = initiatives.filter(i => i.id !== id);
    saveData();
    renderInitiatives();
}

function clearInitiatives() {
    if (initiatives.length === 0) return;

    if (confirm('Are you sure you want to clear all initiatives?')) {
        initiatives = [];
        saveData();
        renderInitiatives();
    }
}

function renderInitiatives() {
    const container = document.getElementById('initiative-list');

    if (initiatives.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No initiatives added yet. Add combatants to track turn order!</p></div>';
        return;
    }

    container.innerHTML = initiatives.map((init, index) => `
        <div class="initiative-item ${index === 0 ? 'active' : ''}">
            <span class="initiative-name">${init.name}</span>
            <div style="display: flex; gap: 10px; align-items: center;">
                <span class="initiative-value">${init.value}</span>
                <button class="initiative-remove" onclick="removeInitiative(${init.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

// Make functions available globally
window.openCharacterModal = openCharacterModal;
window.deleteCharacter = deleteCharacter;
window.removeInitiative = removeInitiative;
