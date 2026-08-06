"""
AVG art. 15 (recht op inzage) + art. 20 (recht op dataportabiliteit).

Gebruik:
    python manage.py export_user_data <username> --out export.json

Exporteert ALLE gegevens die aan een gebruiker gekoppeld zijn in een
machineleesbaar formaat (JSON), zoals de AVG vereist bij een verzoek.
Breid de 'related_data'-sectie uit zodra er meer modellen bijkomen die
persoonsgegevens bevatten (bv. bestelgeschiedenis, supporttickets).
"""
import json
from django.core.management.base import BaseCommand, CommandError
from django.core.serializers.json import DjangoJSONEncoder
from accounts.models import User, PortfolioEntry


class Command(BaseCommand):
    help = "Exporteert alle persoonsgegevens van een gebruiker (AVG art. 15/20)."

    def add_arguments(self, parser):
        parser.add_argument("username")
        parser.add_argument("--out", default=None, help="Output-bestand (default: <username>_export.json)")

    def handle(self, *args, **options):
        try:
            user = User.objects.get(username=options["username"])
        except User.DoesNotExist:
            raise CommandError(f"Gebruiker '{options['username']}' niet gevonden.")

        data = {
            "account": {
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "date_joined": user.date_joined,
                "last_login": user.last_login,
                "tier": user.tier,
                "credits_balance": str(user.credits_balance),
                "terms_accepted_at": user.terms_accepted_at,
                "privacy_policy_version_accepted": user.privacy_policy_version_accepted,
                "marketing_consent": user.marketing_consent,
            },
            "portfolio": [
                {
                    "planet": p.planet.planet_name,
                    "acquired_at": p.acquired_at,
                    "purchase_price_credits": str(p.purchase_price_credits),
                }
                for p in PortfolioEntry.objects.filter(user=user)
            ],
        }

        out_path = options["out"] or f"{user.username}_export.json"
        with open(out_path, "w") as f:
            json.dump(data, f, indent=2, cls=DjangoJSONEncoder, default=str)

        self.stdout.write(self.style.SUCCESS(f"Export weggeschreven naar {out_path}"))
