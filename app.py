from flask import Flask, jsonify, render_template, request
from game_logic.engine import BattleEngine
from game_logic.models import db, Player, CharacterClass, Monster

app = Flask(__name__)

# Configuração do banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///aldurian.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicialização do banco
db.init_app(app)

# Dicionário para guardar as batalhas ativas
active_battles = {}

# --- Funções de "Seeding" (Povoar o Banco) ---

def seed_classes():
    # Verifica se a primeira classe já existe para não duplicar
    if db.session.get(CharacterClass, 1):
        return

    print("Semeando as classes de personagem...")
    
    guerreiro = CharacterClass(
        name="Guerreiro",
        description="Forte e resiliente, especialista no combate corpo a corpo.",
        base_hp=120, base_mp=20, base_attack=12,
        special_skill_name="Golpe Poderoso",
        special_skill_description="Um ataque devastador que pode atordoar o inimigo.",
        special_skill_cost=15
    )
    
    arqueiro = CharacterClass(
        name="Arqueiro",
        description="Ágil e preciso, mestre do combate à distância.",
        base_hp=85, base_mp=30, base_attack=10,
        special_skill_name="Flecha Perfurante",
        special_skill_description="Um tiro que ignora parte da defesa do inimigo.",
        special_skill_cost=10
    )

    mago = CharacterClass(
        name="Mago",
        description="Frágil, mas com um poder arcano imenso, capaz de grandes danos.",
        base_hp=70, base_mp=80, base_attack=5,
        special_skill_name="Bola de Fogo",
        special_skill_description="Conjura uma esfera de fogo que causa dano em área.",
        special_skill_cost=25
    )

    paladino = CharacterClass(
        name="Paladino",
        description="Um guerreiro sagrado que equilibra ataque, defesa e cura.",
        base_hp=100, base_mp=50, base_attack=8,
        special_skill_name="Cura Sagrada",
        special_skill_description="Invoca a luz para restaurar uma parte de seus pontos de vida.",
        special_skill_cost=20
    )

    db.session.add_all([guerreiro, arqueiro, mago, paladino])
    db.session.commit()
    print("Classes criadas com sucesso!")

def seed_monsters():
    if db.session.get(Monster, 1): return
    print("Semeando monstros...")
    goblin = Monster(
        name="Goblin Fraco",
        description="Uma criatura pequena e irritante.",
        hp=30, 
        max_hp=30,
        attack_power=5, 
        xp_reward=10,
        ascii_art="""
          (o)
         /|\\
         / \\
        """
    )
    db.session.add(goblin)
    db.session.commit()
    print("Monstros criados com sucesso!")

# --- Rotas da Aplicação ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/classes')
def get_classes():
    classes = CharacterClass.query.all()
    classes_data = [{
        "id": c.id,
        "name": c.name,
        "description": c.description,
        "skill_name": c.special_skill_name
    } for c in classes]
    return jsonify(classes_data)

@app.route('/api/create_character', methods=['POST'])
def create_character():
    data = request.json
    player_name = data.get('name')
    class_id = data.get('class_id')

    if not player_name or not class_id:
        return jsonify({"error": "Nome e classe são obrigatórios"}), 400

    chosen_class = db.session.get(CharacterClass, class_id)
    if not chosen_class:
        return jsonify({"error": "Classe inválida"}), 400

    new_player = Player(
        name=player_name,
        class_id=chosen_class.id,
        level=1,
        xp=0,
        max_hp=chosen_class.base_hp,
        hp=chosen_class.base_hp,
        max_mp=chosen_class.base_mp,
        mp=chosen_class.base_mp,
        base_attack=chosen_class.base_attack
    )

    db.session.add(new_player)
    db.session.commit()
    
    return jsonify({"success": True, "player_id": new_player.id})

@app.route('/api/battle/start', methods=['POST'])
def start_battle():
    player_id = request.json.get('player_id')
    player = db.session.get(Player, player_id)
    monster = db.session.get(Monster, 1)
    
    if not player or not monster:
        return jsonify({"error": "Jogador ou monstro não encontrado"}), 404
        
    battle = BattleEngine(player, monster)
    active_battles[player.id] = battle
    
    return jsonify(battle.get_state())

@app.route('/api/battle/action', methods=['POST'])
def battle_action():
    player_id = request.json.get('player_id')
    action = request.json.get('action')
    
    battle = active_battles.get(player_id)
    if not battle:
        return jsonify({"error": "Nenhuma batalha ativa para este jogador"}), 404

    if action == 'attack':
        battle.player_attack()
    elif action == 'special_skill':
        battle.player_special_skill()
    
    if battle.is_over and battle.winner == 'player':
        # Encontra o jogador no banco para atualizar o XP
        player_in_db = db.session.get(Player, player_id)
        player_in_db.xp = battle.player.xp
        db.session.commit()
        del active_battles[player_id]
    
    return jsonify(battle.get_state())

# --- Bloco de Inicialização ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_classes()
        seed_monsters()
    app.run(debug=True, port=5000, host="0.0.0.0")
