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
from django.utils import timezone

# De pipeline-scripts staan in de projectroot (naast manage.py), nog niet
# verplaatst in een package -- dit voegt die map toe aan het pad zodat de
# bestaande, ongewijzigde scripts direct importeerbaar zijn.
sys.path.insert(0, str(Path(__file__).resolve().parents[4]))

from build_database import build  # noqa: E402
from catalog.models import Planet


class Command(BaseCommand):
    help = "Synchroniseert de Planet-tabel met de NASA Exoplanet Archive, exoplanet.eu en het zonnestelsel."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--no-live", action="store_true")

    def handle(self, *args, **options):
        self.stdout.write("Pipeline starten...")
        planets_data = build(
            limit=options["limit"],
            use_live_api=not options["no_live"],
            out_path="/tmp/planets_sync.json",  # ook als JSON-audit-trail bewaard
        )

        model_fields = {f.name for f in Planet._meta.get_fields()}
        created, updated = 0, 0
        for p in planets_data:
            defaults = {k: v for k, v in p.items() if k in model_fields and k != "planet_name"}
            obj, was_created = Planet.objects.update_or_create(
                planet_name=p["planet_name"], defaults=defaults
            )
            created += was_created
            updated += not was_created

        self.stdout.write(self.style.SUCCESS(
            f"Klaar: {created} nieuw, {updated} bijgewerkt, "
            f"totaal {Planet.objects.count()} planeten in de database. "
            f"({timezone.now().isoformat()})"
        ))
