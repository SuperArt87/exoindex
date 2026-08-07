"""
Gebruik:
    python manage.py apply_demand_pricing

LAATSTE stap in de pipeline. Combineert de drie lagen tot de finale
market_value_credits:

    market_value_credits = base_market_value_credits
                            x market_sentiment_multiplier   (extern: nieuws/beurzen)
                            x demand_multiplier              (intern: eigen platform-activiteit)

FORMULE voor demand_multiplier, per planeet:

    net_demand = (aantal koop-transacties in de laatste 7 dagen)
               - (aantal verkoop-transacties in de laatste 7 dagen)

    demand_effect = clip(DEMAND_SENSITIVITY * net_demand, -MAX_DEMAND_EFFECT, +MAX_DEMAND_EFFECT)

    demand_multiplier = max(0.1, 1 + demand_effect)

Een planeet die netto veel gekocht wordt, wordt dus duurder -- precies
zoals vraag/aanbod op een echte markt werkt, begrensd op maximaal +-25%. In tegenstelling tot
market_sentiment (extern, vervalt via half-life) is dit een DIRECTE,
doorlopende afspiegeling van recente activiteit -- geen apart vervalmodel
nodig, want het venster van "laatste 7 dagen" schuift vanzelf mee bij elke
run.

Volgorde van de volledige pipeline:
    1. sync_planets
    2. apply_resource_discoveries
    3. apply_market_events        (schrijft base_market_value_credits + sentiment)
    4. apply_demand_pricing        (schrijft demand + de FINALE market_value_credits)
"""
import sys
from pathlib import Path
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

sys.path.insert(0, str(Path(__file__).resolve().parents[4]))

from catalog.models import Planet  # noqa: E402
from accounts.models import Transaction  # noqa: E402

DEMAND_SENSITIVITY = 0.03   # elke netto-transactie beweegt de prijs 3%
MAX_DEMAND_EFFECT = 0.25    # verlaagd van 0,5 -- vraag/populariteit mag de
                             # prijs meebewegen, maar niet harder dan het
                             # bredere marktsentiment kan bewegen (was
                             # voorheen juist ruimer, nu meer in balans)
LOOKBACK_DAYS = 7


class Command(BaseCommand):
    help = "Berekent demand_multiplier o.b.v. koop/verkoop-activiteit en combineert alle lagen tot de finale marktwaarde."

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=LOOKBACK_DAYS)

        with transaction.atomic():
            updated = 0
            for planet in Planet.objects.all():
                if planet.base_market_value_credits is None:
                    continue

                recent = Transaction.objects.filter(planet=planet, created_at__gte=cutoff)
                buy_count = recent.filter(action="buy").count()
                sell_count = recent.filter(action="sell").count()
                net_demand = buy_count - sell_count

                raw_effect = DEMAND_SENSITIVITY * net_demand
                demand_effect = max(-MAX_DEMAND_EFFECT, min(MAX_DEMAND_EFFECT, raw_effect))
                demand_multiplier = max(0.1, 1 + demand_effect)

                sentiment_multiplier = planet.market_sentiment_multiplier or 1.0
                final_value = round(
                    float(planet.base_market_value_credits) * sentiment_multiplier * demand_multiplier, 2
                )

                planet.demand_multiplier = round(demand_multiplier, 4)
                planet.market_value_credits = final_value
                planet.save(update_fields=["demand_multiplier", "market_value_credits"])
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Finale marktwaarde berekend voor {updated} planeten."))
