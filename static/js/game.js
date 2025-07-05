// --- Event Listener para garantir que o DOM está carregado ---
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Elementos da UI ---
    const classContainer = document.getElementById('class-selection-container');
    const loadingText = document.getElementById('loading-classes');
    const nameInput = document.getElementById('player-name');
    const createButton = document.getElementById('create-character-btn');
    const errorMessage = document.getElementById('error-message');
    const creationSection = document.getElementById('character-creation-section');
    const gameWorldSection = document.getElementById('game-world-section');
    const welcomePlayerName = document.getElementById('welcome-player-name');

    let selectedClassId = null;

    // --- Ícones para as classes (SVG) ---
    const icons = {
        "Guerreiro": `<svg class="icon-style" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v11m-8-6h16" /></svg>`, // Espada simples
        "Arqueiro": `<svg class="icon-style" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V5.75A2.25 2.25 0 0018 3.5H6A2.25 2.25 0 003.75 5.75v12.5A2.25 2.25 0 006 20.25z" /></svg>`, // Arco e flecha simbólico
        "Mago": `<svg class="icon-style" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>`, // Símbolo de magia/sol
        "Paladino": `<svg class="icon-style" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.6-3.751A11.959 11.959 0 0112 2.724z" /></svg>` // Escudo
    };

    // --- Lógica ---

    // Função para selecionar uma classe
    function selectClass(cardElement, classId) {
        document.querySelectorAll('.class-card').forEach(card => card.classList.remove('selected'));
        cardElement.classList.add('selected');
        selectedClassId = classId;
    }

    // Função para buscar e renderizar as classes
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
                card.innerHTML = `
                    <div class="flex justify-center text-yellow-400 mb-3">${icons[c.name] || ''}</div>
                    <h3 class="text-2xl medieval-font text-yellow-500">${c.name}</h3>
                    <p class="text-gray-400 text-sm mt-2">${c.description}</p>
                `;
                card.addEventListener('click', () => selectClass(card, c.id));
                classContainer.appendChild(card);
            });

        } catch (error) {
            if (loadingText) {
                loadingText.textContent = 'Erro ao carregar as classes. Tente recarregar a página.';
            }
            console.error(error);
        }
    }

    // Função para criar o personagem
    async function handleCreateCharacter() {
        const playerName = nameInput.value.trim();
        errorMessage.textContent = '';

        if (!playerName) {
            errorMessage.textContent = 'Por favor, insira um nome para seu herói.';
            return;
        }
        if (!selectedClassId) {
            errorMessage.textContent = 'Por favor, selecione uma classe.';
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

            if (!response.ok || result.error) {
                throw new Error(result.error || 'Ocorreu um erro desconhecido.');
            }

            console.log('Personagem criado com sucesso!', result);
            localStorage.setItem('player_id', result.player_id);

            creationSection.classList.add('hidden');
            welcomePlayerName.textContent = playerName;
            gameWorldSection.classList.remove('hidden');

        } catch (error) {
            errorMessage.textContent = error.message;
            createButton.disabled = false;
            createButton.textContent = 'Iniciar Jornada';
        }
    }

    // --- Adiciona os Event Listeners ---
    fetchAndRenderClasses(); // Busca as classes assim que o script carrega
    createButton.addEventListener('click', handleCreateCharacter);
});
