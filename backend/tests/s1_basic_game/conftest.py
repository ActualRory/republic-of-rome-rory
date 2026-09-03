import pytest

from rorapp.actions.give_battle import GiveBattleAction
from rorapp.classes.random_resolver import RandomResolver
from rorapp.effects.meta.effect_executor import execute_effects_and_manage_actions
from rorapp.helpers.combat_order import campaign_to_attack
from rorapp.models import Campaign, Game


@pytest.fixture
def fight_battles():
    """Run the game loop, giving battle for each commander whose turn it is."""

    def fight(game: Game, resolver: RandomResolver, limit: int = 10) -> None:
        execute_effects_and_manage_actions(game.id, resolver)
        for _ in range(limit):
            campaign = campaign_to_attack(list(Campaign.objects.filter(game=game)))
            if not campaign or not campaign.commander:
                return
            faction = campaign.commander.faction
            if not faction:
                return
            GiveBattleAction().execute(game.id, faction.id, {}, resolver)
            execute_effects_and_manage_actions(game.id, resolver)

    return fight
