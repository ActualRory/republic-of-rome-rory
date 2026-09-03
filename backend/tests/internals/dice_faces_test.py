import pytest

from rorapp.classes.random_resolver import FakeRandomResolver, RealRandomResolver


@pytest.mark.parametrize("total", [3, 4, 5, 6, 7, 9, 10, 11, 13, 15, 18])
def test_queued_total_splits_into_three_dice(total: int):
    # Arrange
    resolver = FakeRandomResolver()
    resolver.dice_rolls = [total]

    # Act
    faces = resolver.roll_dice_faces(3)

    # Assert
    assert sum(faces) == total
    assert len(faces) == 3
    assert all(1 <= face <= 6 for face in faces)


def test_a_total_no_dice_could_produce_is_reported_as_one_face():
    # Arrange
    resolver = FakeRandomResolver()
    resolver.dice_rolls = [1]

    # Act
    faces = resolver.roll_dice_faces(3)

    # Assert
    assert faces == [1]


def test_real_resolver_totals_match_its_faces():
    # Arrange
    resolver = RealRandomResolver()

    # Act
    faces = [resolver.roll_dice_faces(3) for _ in range(50)]

    # Assert
    assert all(len(f) == 3 for f in faces)
    assert all(1 <= face <= 6 for f in faces for face in f)
