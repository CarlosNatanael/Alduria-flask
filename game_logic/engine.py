import random

class BattleEngine:
    def __init__(self, player, monster):
        self.player = player
        self.monster = monster
        self.turn = 'player'  # O jogador sempre começa
        self.log = [f"Um {monster.name} apareceu!"]
        self.is_over = False
        self.winner = None

    def _check_game_over(self):
        if self.player.hp <= 0:
            self.is_over = True
            self.winner = 'monster'
            self.log.append(f"{self.player.name} foi derrotado...")
        elif self.monster.hp <= 0:
            self.is_over = True
            self.winner = 'player'
            self.log.append(f"Você derrotou o {self.monster.name}!")
            # Lógica de recompensa
            self.player.xp += self.monster.xp_reward
            self.log.append(f"Você ganhou {self.monster.xp_reward} de XP.")
            # TODO: Adicionar lógica de level up aqui

    def _monster_turn(self):
        if self.is_over: return
        
        damage = random.randint(int(self.monster.attack_power * 0.8), self.monster.attack_power)
        self.player.hp -= damage
        self.log.append(f"O {self.monster.name} ataca, causando {damage} de dano.")
        self._check_game_over()
        if not self.is_over:
            self.turn = 'player'

    def player_attack(self):
        if self.turn != 'player' or self.is_over: return
        
        damage = random.randint(self.player.base_attack, int(self.player.base_attack * 1.2))
        self.monster.hp -= damage
        self.log.append(f"Você ataca o {self.monster.name}, causando {damage} de dano.")
        
        self.turn = 'monster'
        self._check_game_over()
        if not self.is_over:
            self._monster_turn()

    def player_special_skill(self):
        if self.turn != 'player' or self.is_over: return

        skill_cost = self.player.character_class.special_skill_cost
        if self.player.mp < skill_cost:
            self.log.append("Você não tem Mana suficiente!")
            return # A ação falha, mas não passa o turno

        self.player.mp -= skill_cost
        skill_name = self.player.character_class.special_skill_name
        
        # Lógica de dano da habilidade (ex: 2x o ataque base)
        damage = self.player.base_attack * 2
        self.monster.hp -= damage
        self.log.append(f"Você usa {skill_name}, gastando {skill_cost} MP e causando {damage} de dano!")
        
        self.turn = 'monster'
        self._check_game_over()
        if not self.is_over:
            self._monster_turn()
            
    def get_state(self):
        """Retorna o estado atual da batalha para a API."""
        return {
            "player": {
                "name": self.player.name,
                "hp": self.player.hp,
                "max_hp": self.player.max_hp,
                "mp": self.player.mp,
                "max_mp": self.player.max_mp,
                "level": self.player.level,
                "xp": self.player.xp,
                "skill": {
                    "name": self.player.character_class.special_skill_name,
                    "description": self.player.character_class.special_skill_description,
                    "cost": self.player.character_class.special_skill_cost
                }
            },
            "monster": {
                "name": self.monster.name,
                "hp": self.monster.hp,
                "max_hp": self.monster.max_hp, 
                "ascii_art": self.monster.ascii_art
            },
            "turn": self.turn,
            "log": self.log,
            "is_over": self.is_over,
            "winner": self.winner
        }
