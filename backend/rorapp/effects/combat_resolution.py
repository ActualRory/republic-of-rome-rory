from rorapp.classes.random_resolver import RandomResolver
from rorapp.effects.meta.effect_base import EffectBase
from rorapp.game_state.game_state_snapshot import GameStateSnapshot
from rorapp.helpers.combat_order import next_pending_campaigns
from rorapp.helpers.resolve_combat import resolve_combat
from rorapp.models import Campaign, Game, Senator


class CombatResolutionEffect(EffectBase):

    def validate(self, game_state: GameStateSnapshot) -> bool:
        if game_state.game.phase != Game.Phase.COMBAT:
            return False
        if game_state.game.sub_phase != Game.SubPhase.RESOLUTION:
            return False
        if any(c.imminent for c in game_state.campaigns):
            return False
        if any(
            s.has_status_item(Senator.StatusItem.CONSIDERING_LAND_BATTLE)
            for s in game_state.senators
        ):
            return False

        pending = next_pending_campaigns(game_state.campaigns)
        if len(pending) != 1:
            return True

        # A commander with no faction has nobody to give him the order to attack
        commander = pending[0].commander
        return not (commander and commander.faction)

    def execute(self, game_id: int, random_resolver: RandomResolver) -> bool:
        game = Game.objects.get(id=game_id)
        campaigns = list(Campaign.objects.filter(game=game_id))
        pending = next_pending_campaigns(campaigns)

        if not pending:
            game.sub_phase = Game.SubPhase.END
            game.save()
            return True

        if len(pending) > 1:
            for contender in pending:
                contender.imminent = True
            Campaign.objects.bulk_update(pending, ["imminent"])
            return True

        resolve_combat(game.id, pending[0].id, random_resolver)
        return True
