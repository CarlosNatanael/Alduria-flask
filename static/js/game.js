document.addEventListener('DOMContentLoaded', () => {
    
    // --- Seletores de Elementos ---
    const appContainer = document.getElementById('app');
    const creationSection = document.getElementById('character-creation-section');
    const classContainer = document.getElementById('class-selection-container');
    const loadingText = document.getElementById('loading-classes');
    const nameInput = document.getElementById('player-name');
    const createButton = document.getElementById('create-character-btn');
    const errorMessage = document.getElementById('error-message');
    const battleSection = document.getElementById('battle-section');
    const playerPanel = document.getElementById('player-panel');
    const monsterPanel = document.getElementById('monster-panel');
    const playerBattleName = document.getElementById('player-battle-name');
    const playerHpBar = document.getElementById('player-hp-bar');
    const playerHpText = document.getElementById('player-hp-text');
    const playerMpBar = document.getElementById('player-mp-bar');
    const playerMpText = document.getElementById('player-mp-text');
    const monsterBattleName = document.getElementById('monster-battle-name');
    const monsterAsciiArt = document.getElementById('monster-ascii-art');
    const monsterHpBar = document.getElementById('monster-hp-bar');
    const monsterHpText = document.getElementById('monster-hp-text');
    const turnIndicator = document.getElementById('turn-indicator');
    const battleLog = document.getElementById('battle-log');
    const battleControls = document.getElementById('battle-controls');
    const attackBtn = document.getElementById('attack-btn');
    const skillBtn = document.getElementById('skill-btn');
    const skillTooltip = document.getElementById('skill-tooltip');
    const battleOverSection = document.getElementById('battle-over-section');
    const battleResultText = document.getElementById('battle-result-text');
    const continueBtn = document.getElementById('continue-btn');

    // --- Estado do Jogo ---
    let selectedClassId = null;
    let playerId = null; // Começa como nulo, será definido após a criação
    let lastLogLength = 0;
    let skillInfo = {};
    let currentMonsterMaxHp = 1;

    // --- Ícones ---
    const icons = {
        "Guerreiro": `<svg class="icon-style" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v11m-8-6h16" /></svg>`,
        "Arqueiro": `<svg class="icon-style" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V5.75A2.25 2.25 0 0018 3.5H6A2.25 2.25 0 003.75 5.75v12.5A2.25 2.25 0 006 20.25z" /></svg>`,
        "Mago": `<svg class="icon-style" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>`,
        "Paladino": `<svg class="icon-style" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.6-3.751A11.959 11.959 0 0112 2.724z" /></svg>`
    };

    // --- LÓGICA DE CRIAÇÃO DE PERSONAGEM ---
    async function fetchAndRenderClasses() {
        try {
            const response = await fetch('/api/classes');
            if (!response.ok) throw new Error('Falha ao buscar classes.');
            const classes = await response.json();
            if (loadingText) loadingText.remove();
            classContainer.innerHTML = '';
            classes.forEach(c => {
                const card = document.createElement('div');
                card.className = 'class-card bg-gray-800 rounded-lg p-5 text-center cursor-pointer border-2 border-gray-700';
                card.innerHTML = `<div class="flex justify-center text-yellow-400 mb-3">${icons[c.name] || ''}</div><h3 class="text-2xl medieval-font text-yellow-500">${c.name}</h3><p class="text-gray-400 text-sm mt-2">${c.description}</p>`;
                card.addEventListener('click', () => selectClass(card, c.id));
                classContainer.appendChild(card);
            });
        } catch (error) {
            if (loadingText) loadingText.textContent = 'Erro ao carregar as classes.';
            console.error(error);
        }
    }
    function selectClass(cardElement, classId) {
        document.querySelectorAll('.class-card').forEach(card => card.classList.remove('selected'));
        cardElement.classList.add('selected');
        selectedClassId = classId;
    }
    async function handleCreateCharacter() {
        const playerName = nameInput.value.trim();
        errorMessage.textContent = '';
        if (!playerName || !selectedClassId) {
            errorMessage.textContent = 'Por favor, insira um nome e selecione uma classe.';
            return;
        }
        createButton.disabled = true;
        createButton.textContent = 'Forjando Destino...';
        try {
            const response = await fetch('/api/create_character', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: playerName, class_id: selectedClassId })
            });
            const result = await response.json();
            if (!response.ok || result.error) throw new Error(result.error || 'Ocorreu um erro.');
            
            playerId = result.player_id;
            transitionToBattle();
        } catch (error) {
            errorMessage.textContent = error.message;
            createButton.disabled = false;
            createButton.textContent = 'Iniciar Jornada';
        }
    }

    // --- FUNÇÕES DE EFEITOS VISUAIS ---
    function showFloatingDamage(targetPanel, damage) {
        const container = targetPanel.querySelector('.damage-popup-container');
        const popup = document.createElement('div');
        popup.className = 'damage-popup';
        popup.textContent = damage;
        container.appendChild(popup);
        setTimeout(() => popup.remove(), 1500);
    }
    function triggerFlash(targetPanel) {
        targetPanel.classList.add('damage-flash');
        setTimeout(() => targetPanel.classList.remove('damage-flash'), 300);
    }
    function triggerScreenShake() {
        appContainer.classList.add('screen-shake');
        setTimeout(() => appContainer.classList.remove('screen-shake'), 400);
    }

    // --- LÓGICA DE BATALHA ---
    function updateBattleUI(state) {
        playerBattleName.textContent = state.player.name;
        playerHpBar.style.width = `${(state.player.hp / state.player.max_hp) * 100}%`;
        playerHpText.textContent = `HP: ${state.player.hp} / ${state.player.max_hp}`;
        playerMpBar.style.width = `${(state.player.mp / state.player.max_mp) * 100}%`;
        playerMpText.textContent = `MP: ${state.player.mp} / ${state.player.max_mp}`;
        
        monsterBattleName.textContent = state.monster.name;
        monsterAsciiArt.textContent = state.monster.ascii_art;
        currentMonsterMaxHp = state.monster.max_hp;
        monsterHpBar.style.width = `${(state.monster.hp / currentMonsterMaxHp) * 100}%`;
        monsterHpText.textContent = `HP: ${state.monster.hp} / ${currentMonsterMaxHp}`;
        
        turnIndicator.textContent = state.turn === 'player' ? 'Seu Turno' : 'Turno do Inimigo';

        const newMessages = state.log.slice(lastLogLength);
        newMessages.forEach(message => {
            const p = document.createElement('p');
            p.textContent = message;
            battleLog.appendChild(p);
            const damageMatch = message.match(/causando (\d+) de dano/);
            if (damageMatch) {
                const damage = damageMatch[1];
                if (message.includes('Você ataca') || message.includes('Você usa')) {
                    showFloatingDamage(monsterPanel, damage);
                    triggerFlash(monsterPanel);
                } else {
                    showFloatingDamage(playerPanel, damage);
                    triggerFlash(playerPanel);
                    triggerScreenShake();
                }
            }
        });
        lastLogLength = state.log.length;
        battleLog.scrollTop = battleLog.scrollHeight;

        if (state.is_over) {
            battleControls.classList.add('hidden');
            turnIndicator.classList.add('hidden');
            battleOverSection.classList.remove('hidden');
            battleResultText.textContent = state.winner === 'player' ? 'Vitória!' : 'Derrota...';
        } else {
            attackBtn.disabled = state.turn !== 'player';
            skillBtn.disabled = state.turn !== 'player';
        }
    }

    async function startBattle() {
        if (!playerId) return;
        const response = await fetch('/api/battle/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_id: playerId })
        });
        const gameState = await response.json();
        skillInfo = gameState.player.skill;
        lastLogLength = 0;
        battleLog.innerHTML = '';
        updateBattleUI(gameState);
    }

    async function handlePlayerAction(actionType) {
        attackBtn.disabled = true;
        skillBtn.disabled = true;
        turnIndicator.textContent = 'Processando...';
        const response = await fetch('/api/battle/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_id: playerId, action: actionType })
        });
        const gameState = await response.json();
        updateBattleUI(gameState);
    }
    
    function transitionToBattle() {
        creationSection.classList.add('hidden');
        battleSection.classList.remove('hidden');
        battleControls.classList.remove('hidden');
        battleOverSection.classList.add('hidden');
        turnIndicator.classList.remove('hidden');
        startBattle();
    }

    // --- Inicialização e Event Listeners ---
    fetchAndRenderClasses();
    createButton.addEventListener('click', handleCreateCharacter);
    attackBtn.addEventListener('click', () => handlePlayerAction('attack'));
    skillBtn.addEventListener('click', () => handlePlayerAction('special_skill'));
    continueBtn.addEventListener('click', () => window.location.reload());

    skillBtn.addEventListener('mouseenter', () => {
        if (skillInfo.name) {
            skillTooltip.innerHTML = `<strong class="text-yellow-400">${skillInfo.name}</strong><p class="text-gray-300">${skillInfo.description}</p><p class="text-blue-400 mt-1">Custo: ${skillInfo.cost} MP</p>`;
            skillTooltip.classList.remove('hidden');
        }
    });
    skillBtn.addEventListener('mouseleave', () => {
        skillTooltip.classList.add('hidden');
    });
});
