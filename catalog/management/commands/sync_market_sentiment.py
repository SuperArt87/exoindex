"""
Gebruik:
    python manage.py sync_market_sentiment

Genereert automatisch een globaal market_sentiment-MarketEvent op basis van
de Nasdaq (zie fetch_market_sentiment.py voor de formule). Draai dit vaker
dan sync_planets/apply_market_events voor de wetenschap -- bv. dagelijks --
want beurssentiment beweegt sneller dan astronomische data.

BELANGRIJK: dit vervangt het vorige auto-gegenereerde sentiment-event i.p.v.
er een nieuwe aan toe te voegen, anders stapelen oude sentiment-events zich
op en telt hun effect (via het optel-mechanisme in apply_market_events) ten
onrechte dubbel of meervoudig mee.
"""
import sys
from pathlib import Path

from django.core.management.base import BaseCommand
from django.utils import timezone

sys.path.insert(0, str(Path(__file__).resolve().parents[4]))

from fetch_market_sentiment import fetch_global_sentiment  # noqa: E402
from catalog.models import MarketEvent


class Command(BaseCommand):
    help = "Genereert automatisch een market_sentiment-event o.b.v. VS/EU/Azie-beursdata."

    def handle(self, *args, **options):
        try:
            magnitude, pct_change, details = fetch_global_sentiment()
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Kon beursdata niet ophalen: {e}"))
            return

        MarketEvent.objects.filter(
            category="market_sentiment", is_auto_generated=True, is_active=True,
        ).update(is_active=False)

        richting = "positief" if magnitude >= 0 else "negatief"
        indices_str = ", ".join(details["indices_used"])
        vix_str = f", VIX={details['vix_value']} (dempingsfactor {details['vix_dampening_factor']:.2f})" if details.get("vix_value") else ""
        MarketEvent.objects.create(
            title=f"Automatisch marktsentiment ({richting}, o.b.v. {indices_str})",
            description=(
                f"Gewogen gecombineerde verandering: {pct_change:+.2%}. "
                f"Gedempt (factor {details['damping_factor']}) en begrensd op +-15%{vix_str}. "
                f"Per index: " +
                ", ".join(f"{k}: {v['pct_change']:+.2%}" for k, v in details["per_index"].items())
            ),
            category="market_sentiment",
            scope="global",
            magnitude=magnitude,
            starts_at=timezone.now(),
            half_life_days=5,
            is_active=True,
            is_auto_generated=True,
        )

        self.stdout.write(self.style.SUCCESS(
            f"Nieuw sentiment-event aangemaakt: {magnitude:+.2%} "
            f"(gecombineerd {pct_change:+.2%} over {indices_str})"
        ))
