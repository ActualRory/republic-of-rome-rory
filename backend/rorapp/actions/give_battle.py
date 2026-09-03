from typing import Any, Dict, List, Optional

from rorapp.actions.meta.action_base import ActionBase
from rorapp.actions.meta.execution_result import ExecutionResult
from rorapp.classes.random_resolver import RandomResolver
from rorapp.game_state.game_state_live import GameStateLive
from rorapp.game_state.game_state_snapshot import GameStateSnapshot
from rorapp.helpers.combat_order import campaign_to_attack
from rorapp.helpers.resolve_combat import resolve_combat
from rorapp.models import AvailableAction, Campaign, Faction, Game, Senator


class GiveBattleAction(ActionBase):
    NAME = "Give battle"
    POSITION = 0

    def _campaign_for_faction(
        self, game_state: GameStateLive | GameStateSnapshot, faction_id: int
    ) -> Optional[Campaign]:
        if game_state.game.phase != Game.Phase.COMBAT:
            return None
        if game_state.game.sub_phase != Game.SubPhase.RESOLUTION:
            return None
        if any(
            s.has_status_item(Senator.StatusItem.CONSIDERING_LAND_BATTLE)
            for s in game_state.senators
        ):
            return None

        campaign = campaign_to_attack(game_state.campaigns)
        if not campaign or not campaign.commander:
            return None
        commander_faction = campaign.commander.faction
        if commander_faction and commander_faction.id == faction_id:
            return campaign
        return None

    def is_allowed(
        self, game_state: GameStateLive | GameStateSnapshot, faction_id: int
    ) -> Optional[Faction]:
        if not self._campaign_for_faction(game_state, faction_id):
            return None
        return game_state.get_faction(faction_id)

    def get_schema(
        self, snapshot: GameStateSnapshot, faction_id: int
    ) -> List[AvailableAction]:
        campaign = self._campaign_for_faction(snapshot, faction_id)
        faction = snapshot.get_faction(faction_id)
        if not campaign or not faction:
            return []
        return [
            AvailableAction.objects.create(
                game=snapshot.game,
                faction=faction,
                base_name=self.NAME,
                position=self.POSITION,
                field_descriptors=[],
                context={"campaign_id": campaign.id},
            )
        ]

    def execute(
        self,
        game_id: int,
        faction_id: int,
        selection: Dict[str, Any],
        random_resolver: RandomResolver,
    ) -> ExecutionResult:
        campaign = self._campaign_for_faction(GameStateLive(game_id), faction_id)
        if not campaign:
            return ExecutionResult(False)

        resolve_combat(game_id, campaign.id, random_resolver)
        return ExecutionResult(True)
