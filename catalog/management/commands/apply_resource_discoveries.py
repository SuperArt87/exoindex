"""
Gebruik:
    python manage.py apply_resource_discoveries

Herberekent resource_score = base_resource_score + som van geverifieerde
ResourceDiscovery-bonussen voor die planeet, afgekapt op 0-100. GEEN
tijdverval (in tegenstelling tot apply_market_events) -- een blijvende
vondst zoals een diamantafzetting is een feit, geen voorbijgaand sentiment.

Draai dit NA sync_planets en VOOR apply_market_events, want de marktwaarde-
berekening gebruikt het uiteindelijke resource_score.

Volgorde van de volledige pipeline:
    1. sync_planets              (wetenschap: schrijft base_resource_score)
    2. apply_resource_discoveries (blijvende vondsten: schrijft resource_score)
    3. apply_market_events        (macro/sentiment: schrijft market_value_credits)
"""
import sys
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Sum

sys.path.insert(0, str(Path(__file__).resolve().parents[4]))

from catalog.models import Planet, ResourceDiscovery  # noqa: E402


class Command(BaseCommand):
    help = "Herberekent resource_score o.b.v. base_resource_score + blijvende ResourceDiscovery-bonussen."

    def handle(self, *args, **options):
        with transaction.atomic():
            updated = 0
            for planet in Planet.objects.all():
                if planet.base_resource_score is None:
                    continue

                bonus = (
                    ResourceDiscovery.objects
                    .filter(planet=planet, is_verified=True)
                    .aggregate(total=Sum("points_bonus"))["total"]
                ) or 0.0

                new_score = max(0, min(100, planet.base_resource_score + bonus))
                if new_score != planet.resource_score:
                    planet.resource_score = new_score
                    planet.save(update_fields=["resource_score"])
                    updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"resource_score bijgewerkt voor {updated} planeten met actieve ontdekkingen."
        ))
