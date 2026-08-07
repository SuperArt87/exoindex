"""
Gebruik:
    python manage.py apply_market_events

Herberekent market_sentiment_multiplier en market_value_credits voor elke
planeet, op basis van actieve MarketEvent-objecten (met tijdverval). Dit is
BEWUST een los command van sync_planets -- de wetenschappelijke basisscores
(habitability_score, resource_score, esi_score) worden hier nooit aangeraakt.

Draai dit vaker dan de wekelijkse astronomische sync (bv. dagelijks, of
zelfs elk uur) -- marktsentiment mag sneller bewegen dan de onderliggende
wetenschap, dat is precies het punt van deze aparte laag.
"""
import sys
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

sys.path.insert(0, str(Path(__file__).resolve().parents[4]))

from scoring import base_market_value  # noqa: E402
from catalog.models import Planet, MarketEvent


class Command(BaseCommand):
    help = "Herberekent marktwaarde o.b.v. actieve MarketEvent-objecten (macro/sentiment-laag)."

    def handle(self, *args, **options):
        now = timezone.now()
        active_events = list(MarketEvent.objects.filter(is_active=True, starts_at__lte=now))
        self.stdout.write(f"{len(active_events)} actieve marktgebeurtenissen gevonden.")

        with transaction.atomic():
            updated = 0
            for planet in Planet.objects.all():
                base = base_market_value(
                    planet.habitability_score, planet.resource_score,
                    planet.distance_from_earth_ly, planet.confidence_score,
                )
                if base is None:
                    continue

                # Effecten van toepasselijke gebeurtenissen worden opgeteld
                # (niet vermenigvuldigd) voor te veel elkaar-versterkende
                # effecten bij meerdere tegelijk actieve events, en dan als
                # één multiplier toegepast.
                total_effect = sum(
                    e.current_effect(now) for e in active_events if e.applies_to(planet)
                )
                multiplier = max(0.1, 1 + total_effect)  # nooit onder 10% van de basiswaarde

                planet.base_market_value_credits = base
                planet.market_sentiment_multiplier = round(multiplier, 4)
                # market_value_credits wordt NIET hier gezet -- dat is de taak
                # van apply_demand_pricing, de laatste stap in de pipeline, die
                # base x sentiment x demand combineert. Draai dit command dus
                # altijd gevolgd door apply_demand_pricing.
                planet.save(update_fields=[
                    "base_market_value_credits", "market_sentiment_multiplier",
                ])
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Marktwaarde bijgewerkt voor {updated} planeten."))
