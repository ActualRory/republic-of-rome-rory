from typing import Any, Dict, Optional

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.timezone import now

from rorapp.models.game import Game


class Log(models.Model):

    class Category(models.TextChoices):
        BATTLE = "battle", "Battle"

    game = models.ForeignKey(Game, related_name="logs", on_delete=models.CASCADE)
    turn = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    phase = models.CharField(
        max_length=10, choices=Game.Phase.choices, blank=True, null=True
    )
    created_on = models.DateTimeField(default=now)
    text = models.TextField()
    category = models.CharField(
        max_length=30, choices=Category.choices, blank=True, default=""
    )
    data = models.JSONField(default=dict, blank=True)

    @classmethod
    def create_object(
        cls,
        game_id: int,
        text: str,
        category: str = "",
        data: Optional[Dict[str, Any]] = None,
    ) -> "Log":
        game = Game.objects.get(id=game_id)
        return Log.objects.create(
            game=game,
            turn=game.turn,
            phase=game.phase,
            text=text,
            category=category,
            data=data or {},
        )
