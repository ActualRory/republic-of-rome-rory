import pytest

from rorapp.actions.give_battle import GiveBattleAction
from rorapp.classes.random_resolver import FakeRandomResolver
from rorapp.effects.meta.effect_executor import execute_effects_and_manage_actions
from rorapp.models import AvailableAction, Campaign, Faction, Game, Legion, War


@pytest.mark.django_db
def test_battle_waits_for_the_commander_to_give_the_order(land_campaign: Campaign):
    # Arrange
    game = land_campaign.game
    for i in range(1, 11):
        Legion.objects.create(game=game, number=i, campaign=land_campaign)
    resolver = FakeRandomResolver()
    resolver.dice_rolls = [18]

    # Act
    execute_effects_and_manage_actions(game.id, resolver)

    # Assert
    game.refresh_from_db()
    assert game.sub_phase == Game.SubPhase.RESOLUTION
    assert War.objects.filter(game=game).exists()
    assert resolver.dice_rolls == [18]


@pytest.mark.django_db
def test_give_battle_is_offered_to_the_commanders_faction(land_campaign: Campaign):
    # Arrange
    game = land_campaign.game
    commander = land_campaign.commander
    assert commander is not None
    for i in range(1, 11):
        Legion.objects.create(game=game, number=i, campaign=land_campaign)
    resolver = FakeRandomResolver()
    resolver.dice_rolls = [18]

    # Act
    execute_effects_and_manage_actions(game.id, resolver)

    # Assert
    offered = list(
        AvailableAction.objects.filter(game=game, base_name=GiveBattleAction.NAME)
    )
    assert [a.faction_id for a in offered] == [commander.faction_id]
    assert offered[0].context == {"campaign_id": land_campaign.id}


@pytest.mark.django_db
def test_giving_battle_resolves_the_war(land_campaign: Campaign, fight_battles):
    # Arrange
    game = land_campaign.game
    for i in range(1, 11):
        Legion.objects.create(game=game, number=i, campaign=land_campaign)
    resolver = FakeRandomResolver()
    resolver.dice_rolls = [18]

    # Act
    fight_battles(game, resolver)

    # Assert
    assert not War.objects.filter(game=game).exists()
    game.refresh_from_db()
    assert game.phase == Game.Phase.REVOLUTION


@pytest.mark.django_db
def test_another_faction_may_not_give_battle(land_campaign: Campaign):
    # Arrange
    game = land_campaign.game
    commander = land_campaign.commander
    assert commander is not None
    for i in range(1, 11):
        Legion.objects.create(game=game, number=i, campaign=land_campaign)
    resolver = FakeRandomResolver()
    resolver.dice_rolls = [18]
    execute_effects_and_manage_actions(game.id, resolver)
    other_faction = (
        Faction.objects.filter(game=game).exclude(senators=commander).first()
    )
    assert other_faction is not None

    # Act
    result = GiveBattleAction().execute(game.id, other_faction.id, {}, resolver)

    # Assert
    assert result.success == False
    assert War.objects.filter(game=game).exists()


@pytest.mark.django_db
def test_unaligned_commander_attacks_without_being_ordered(land_campaign: Campaign):
    # Arrange
    game = land_campaign.game
    commander = land_campaign.commander
    assert commander is not None
    commander.faction = None
    commander.save()
    for i in range(1, 11):
        Legion.objects.create(game=game, number=i, campaign=land_campaign)
    resolver = FakeRandomResolver()
    resolver.dice_rolls = [18]

    # Act
    execute_effects_and_manage_actions(game.id, resolver)

    # Assert
    assert not War.objects.filter(game=game).exists()
