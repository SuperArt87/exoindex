"""
Gebruik:
    python manage.py sync_planets                  # live fetch + volledige sync
    python manage.py sync_planets --no-live         # demo-sample (voor testen)
    python manage.py sync_planets --limit 100       # beperk aantal exoplaneten

Dit command hergebruikt build_database.py (en daarmee scoring.py,
solar_system_data.py, de fetchers) ONGEWIJZIGD -- de webapp en de
data-pipeline blijven zo losse verantwoordelijkheden. Draai dit als
geplande taak (cron/scheduled job op je hostingplatform), niet vanuit de
webserver zelf, want de live TAP-calls kunnen minuten duren.
"""
import sys
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

sys.path.insert(0, str(Path(__file__).resolve().parents[4]))

from build_database import build  # noqa: E402
from catalog.models import Planet

# Velden die ECHTE nieuwe wetenschappelijke informatie vertegenwoordigen --
# een wijziging hierin bumpt Planet.last_content_update_at (drijft de
# "update"-tag in de catalogus). Bewust GEEN market_value_credits/scores die
# puur uit de marktlaag komen (dat verandert toch al bij elke pricing-run,
# zie apply_market_events/apply_demand_pricing, en zou de tag zinloos maken).
CONTENT_FIELDS = {
    "discovery_method", "habitability_score", "base_resource_score",
    "esi_score", "confidence_score", "biosignature_candidate",
    "detected_molecules", "molecule_source", "atmosphere_density",
    "in_habitable_zone",
}


class Command(BaseCommand):
    help = "Synchroniseert de Planet-tabel met de NASA Exoplanet Archive, exoplanet.eu en het zonnestelsel."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--no-live", action="store_true")

    def handle(self, *args, **options):
        self.stdout.write("Pipeline starten (data ophalen, nog niet toepassen op de database)...")
        planets_data = build(
            limit=options["limit"],
            use_live_api=not options["no_live"],
            out_path="/tmp/planets_sync.json",
        )

        model_fields = {f.name for f in Planet._meta.get_fields()}
        now = timezone.now()

        with transaction.atomic():
            created, updated, content_updated = 0, 0, 0
            existing = {
                p.planet_name: p
                for p in Planet.objects.filter(planet_name__in=[p["planet_name"] for p in planets_data])
            }
            for p in planets_data:
                defaults = {k: v for k, v in p.items() if k in model_fields and k != "planet_name"}

                # resource_score uit de pipeline is de PURE formule-uitkomst --
                # dat hoort in base_resource_score, niet in het publieke
                # resource_score-veld (dat kan blijvende ResourceDiscovery-
                # bonussen bevatten die een sync nooit mag wegvegen).
                formula_resource_score = defaults.pop("resource_score", None)
                defaults["base_resource_score"] = formula_resource_score

                before = existing.get(p["planet_name"])
                is_new = before is None
                has_content_change = is_new or any(
                    getattr(before, field) != defaults[field]
                    for field in CONTENT_FIELDS if field in defaults
                )
                if has_content_change:
                    defaults["last_content_update_at"] = now

                obj, was_created = Planet.objects.update_or_create(
                    planet_name=p["planet_name"], defaults=defaults
                )
                if was_created:
                    # Nieuwe planeet: nog geen ontdekkingen mogelijk, dus
                    # resource_score = base_resource_score als startpunt.
                    obj.resource_score = formula_resource_score
                    obj.save(update_fields=["resource_score"])

                created += was_created
                updated += not was_created
                content_updated += has_content_change

        self.stdout.write(self.style.SUCCESS(
            f"Klaar: {created} nieuw, {updated} bijgewerkt "
            f"({content_updated} met echt nieuwe info -> update-tag), "
            f"totaal {Planet.objects.count()} planeten in de database. "
            f"({timezone.now().isoformat()})"
        ))
        self.stdout.write(
            "Let op: draai nu 'apply_resource_discoveries' om resource_score "
            "opnieuw te berekenen inclusief eventuele blijvende vondsten."
        )
