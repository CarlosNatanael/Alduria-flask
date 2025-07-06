from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class CharacterClass(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    # Atributos base que a classe concede no nível 1
    base_hp = db.Column(db.Integer, nullable=False)
    base_mp = db.Column(db.Integer, nullable=False)
    base_attack = db.Column(db.Integer, nullable=False)

    # Nomes das habilidades para referência
    special_skill_name = db.Column(db.String(80))
    special_skill_description = db.Column(db.Text)
    special_skill_cost = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<Class {self.name}>'

class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)

    # ATRIBUTOS DE JOGO
    level = db.Column(db.Integer, default=1)
    xp = db.Column(db.Integer, default=0)
    max_hp = db.Column(db.Integer)
    hp = db.Column(db.Integer)
    max_mp = db.Column(db.Integer)
    mp = db.Column(db.Integer)
    base_attack = db.Column(db.Integer)
    
    # RELACIONAMENTO: Guarda o ID da classe que o jogador escolheu
    class_id = db.Column(db.Integer, db.ForeignKey('character_class.id'), nullable=False)
    character_class = db.relationship('CharacterClass')

    # Atributo de Moralidade/Alinhamento (vamos usar depois)
    alignment = db.Column(db.Integer, default=0)
    
    def __repr__(self):
        return f'<Player {self.name} - {self.character_class.name}>'
    
class Monster(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.Text)
    
    # Atributos de combate do monstro
    hp = db.Column(db.Integer, nullable=False)
    max_hp = db.Column(db.Integer, nullable=False)
    mp = db.Column(db.Integer, default=0)
    attack_power = db.Column(db.Integer, nullable=False)
    
    # Recompensa por derrotá-lo
    xp_reward = db.Column(db.Integer, nullable=False)
    
    # Para a sua ideia de ASCII art!
    ascii_art = db.Column(db.Text)

    def __repr__(self):
        return f'<Monster {self.name}>'
