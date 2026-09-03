from typing import Dict, List, Optional

from rorapp.models import Campaign


def next_pending_campaigns(campaigns: List[Campaign]) -> List[Campaign]:
    """
    Return the pending campaigns against the next war due to be fought.

    Wars are resolved in the order the Senate dispatched the commanders who were
    placed last on each war (1.10.1).
    """

    by_war: Dict[int, List[Campaign]] = {}
    for campaign in campaigns:
        by_war.setdefault(campaign.war_id, []).append(campaign)

    ordered_war_ids = sorted(
        by_war, key=lambda war_id: max(c.id for c in by_war[war_id])
    )
    for war_id in ordered_war_ids:
        pending = [c for c in by_war[war_id] if c.pending]
        if pending:
            return sorted(pending, key=lambda c: c.id)
    return []


def campaign_to_attack(campaigns: List[Campaign]) -> Optional[Campaign]:
    """
    Return the campaign whose commander attacks next, if one is settled.

    Returns None while several commanders are still contesting the order, since
    they must agree who attacks first (1.10.1).
    """

    ready = [c for c in next_pending_campaigns(campaigns) if not c.imminent]
    return ready[0] if len(ready) == 1 else None
