import pytest
from rorapp.helpers.hrao import set_hrao
from rorapp.models import Game, Senator


@pytest.mark.django_db
def test_master_of_horse_outranks_senators_with_more_influence(basic_game: Game):
    # Arrange
    game = basic_game
    junius = Senator.objects.get(game=game, family_name="Junius")
    junius.add_title(Senator.Title.MASTER_OF_HORSE)
    junius.save()

    # Act
    set_hrao(game.id)

    # Assert
    junius.refresh_from_db()
    assert junius.has_title(Senator.Title.HRAO)


@pytest.mark.django_db
def test_censor_outranks_master_of_horse(basic_game: Game):
    # Arrange
    game = basic_game
    junius = Senator.objects.get(game=game, family_name="Junius")
    junius.add_title(Senator.Title.MASTER_OF_HORSE)
    junius.influence = 20
    junius.save()
    aurelius = Senator.objects.get(game=game, family_name="Aurelius")
    aurelius.add_title(Senator.Title.CENSOR)
    aurelius.save()

    # Act
    set_hrao(game.id)

    # Assert
    aurelius.refresh_from_db()
    assert aurelius.has_title(Senator.Title.HRAO)


@pytest.mark.django_db
def test_master_of_horse_becomes_hrao_when_the_dictator_leaves_rome(basic_game: Game):
    # Arrange
    game = basic_game
    julius = Senator.objects.get(game=game, family_name="Julius")
    julius.add_title(Senator.Title.DICTATOR)
    julius.save()
    junius = Senator.objects.get(game=game, family_name="Junius")
    junius.add_title(Senator.Title.MASTER_OF_HORSE)
    junius.save()
    set_hrao(game.id)

    # Act
    julius.location = "Sicilia"
    julius.save()
    set_hrao(game.id)

    # Assert
    junius.refresh_from_db()
    assert junius.has_title(Senator.Title.HRAO)
