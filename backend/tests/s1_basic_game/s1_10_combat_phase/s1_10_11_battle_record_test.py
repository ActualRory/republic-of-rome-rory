import pytest

from rorapp.classes.random_resolver import FakeRandomResolver
from rorapp.models import Campaign, Legion, Log


def _battle_log(game) -> Log:
    return Log.objects.filter(game=game, category=Log.Category.BATTLE).get()


@pytest.mark.django_db
def test_battle_record_holds_the_roll_and_the_arithmetic(
    land_campaign: Campaign, fight_battles
):
    # Arrange
    game = land_campaign.game
    for i in range(1, 11):
        Legion.objects.create(game=game, number=i, campaign=land_campaign)
    resolver = FakeRandomResolver()
    resolver.dice_rolls = [12]

    # Act
    fight_battles(game, resolver)

    # Assert
    data = _battle_log(game).data
    assert data["roll"] == 12
    assert sum(data["dice"]) == 12
    assert data["battle_type"] == "land"
    assert data["unit_strength"] == 10
    assert data["commander_strength"] == 4
    assert data["war_strength"] == 10
    assert data["modifier"] == 4
    assert data["modified_roll"] == 16
    assert data["result"] == "victory"


@pytest.mark.django_db
def test_battle_record_holds_losses_and_rewards(
    land_campaign: Campaign, fight_battles
):
    # Arrange
    game = land_campaign.game
    for i in range(1, 11):
        Legion.objects.create(game=game, number=i, campaign=land_campaign)
    resolver = FakeRandomResolver()
    resolver.dice_rolls = [12]

    # Act
    fight_battles(game, resolver)

    # Assert
    data = _battle_log(game).data
    assert data["legions_lost"] == ["I", "II"]
    assert len(data["legions_surviving"]) == 8
    assert data["war_ends"] == True
    assert data["spoils"] == 20
    assert data["glory"] == 5
    assert data["veteran"] == "III"


@pytest.mark.django_db
def test_battle_record_holds_a_disaster(land_campaign: Campaign, fight_battles):
    # Arrange
    game = land_campaign.game
    for i in range(1, 11):
        Legion.objects.create(game=game, number=i, campaign=land_campaign)
    resolver = FakeRandomResolver()
    resolver.dice_rolls = [13]

    # Act
    fight_battles(game, resolver)

    # Assert
    data = _battle_log(game).data
    assert data["result"] == "disaster"
    assert len(data["legions_lost"]) == 5
    assert data["unrest_change"] == 1
    assert data["war_ends"] == False


@pytest.mark.django_db
def test_logs_outside_a_battle_carry_no_record(
    land_campaign: Campaign, fight_battles
):
    # Arrange
    game = land_campaign.game
    for i in range(1, 11):
        Legion.objects.create(game=game, number=i, campaign=land_campaign)
    resolver = FakeRandomResolver()
    resolver.dice_rolls = [12]

    # Act
    fight_battles(game, resolver)

    # Assert
    others = Log.objects.filter(game=game).exclude(category=Log.Category.BATTLE)
    assert others.exists()
    assert all(log.data == {} and log.category == "" for log in others)
