"""
AVG art. 17 (recht op vergetelheid).

Gebruik:
    python manage.py anonymize_user <username>

Wist persoonsgegevens (naam, e-mail, gebruikersnaam) maar behoudt de
transactiehistorie (PortfolioEntry) i.v.m. wettelijke bewaarplicht voor
financiele administratie -- dit is een expliciete uitzondering in de AVG
zelf (art. 17 lid 3 sub b), dus dit is geen omzeiling van het recht op
vergetelheid maar de correcte manier om het uit te voeren.
"""
from django.core.management.base import BaseCommand, CommandError
from accounts.models import User


class Command(BaseCommand):
    help = "Anonimiseert een gebruikersaccount (AVG art. 17, recht op vergetelheid)."

    def add_arguments(self, parser):
        parser.add_argument("username")
        parser.add_argument(
            "--confirm", action="store_true",
            help="Vereist expliciet om per ongeluk uitvoeren te voorkomen.",
        )

    def handle(self, *args, **options):
        try:
            user = User.objects.get(username=options["username"])
        except User.DoesNotExist:
            raise CommandError(f"Gebruiker '{options['username']}' niet gevonden.")

        if user.is_anonymized:
            self.stdout.write(self.style.WARNING("Deze gebruiker is al geanonimiseerd."))
            return

        if not options["confirm"]:
            raise CommandError(
                "Dit is onomkeerbaar. Voeg --confirm toe om te bevestigen: "
                f"python manage.py anonymize_user {options['username']} --confirm"
            )

        user.anonymize()
        self.stdout.write(self.style.SUCCESS(f"Gebruiker '{options['username']}' geanonimiseerd."))
