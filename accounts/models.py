from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Eigen User-model i.p.v. Django's standaard -- dit is de aanbevolen
    aanpak, zelfs als je nu nog weinig extra velden nodig hebt, omdat je een
    standaard User-model achteraf NIET meer kunt vervangen zonder pijnlijke
    migratie. Nu instellen kost niets, later instellen kost een dag werk.
    """
    TIER_CHOICES = [
        ("free", "Explorer (gratis)"),
        ("premium", "Prospector (premium)"),
        ("elite", "Grondbaron (elite)"),
    ]
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default="free")
    credits_balance = models.DecimalField(max_digits=14, decimal_places=2, default=10000)

    # --- GDPR/AVG ---
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    privacy_policy_version_accepted = models.CharField(max_length=20, null=True, blank=True)
    marketing_consent = models.BooleanField(default=False)
    marketing_consent_updated_at = models.DateTimeField(null=True, blank=True)
    is_anonymized = models.BooleanField(
        default=False,
        help_text="True zodra een verwijderverzoek is verwerkt. Account blijft bestaan "
                   "voor transactie-integriteit, maar persoonsgegevens zijn gewist.",
    )
    anonymized_at = models.DateTimeField(null=True, blank=True)

    def anonymize(self):
        """
        Verwerkt een verwijderverzoek (recht op vergetelheid, AVG art. 17).
        LET OP: transactiegegevens (PortfolioEntry) blijven bestaan i.v.m.
        wettelijke bewaarplicht voor financiele/fiscale administratie
        (AVG art. 17 lid 3 sub b maakt hier expliciet een uitzondering voor)
        -- alleen de koppeling naar identificeerbare persoonsgegevens wordt
        gewist, niet de transactie zelf.
        """
        from django.utils import timezone
        import uuid
        anon_id = uuid.uuid4().hex[:12]
        self.username = f"deleted-user-{anon_id}"
        self.email = ""
        self.first_name = ""
        self.last_name = ""
        self.is_active = False
        self.is_anonymized = True
        self.anonymized_at = timezone.now()
        self.set_unusable_password()
        self.save()

    def __str__(self):
        return f"{self.username} ({self.tier})"


class Transaction(models.Model):
    """
    Transactielogboek -- ELKE koop/verkoop-actie, in tegenstelling tot
    PortfolioEntry (dat alleen de HUIDIGE bezitsstatus toont). Dit is de
    bron voor de vraag/populariteit-laag in de marktwaarde: hoeveel
    EENHEDEN worden netto gekocht/verkocht, los van wie ze nu bezit.

    Aandelen-model (bewust gekozen i.p.v. een 1-akte-per-planeet-model):
    een gebruiker "gelooft" in de waarde van een hemellichaam en kan
    daarom meerdere eenheden kopen, net als aandelen -- geen vaste,
    schaarse voorraad per planeet. price_credits is de prijs PER EENHEID
    op het moment van de transactie (= Planet.market_value_credits op dat
    moment); de totale transactiewaarde is price_credits x quantity.
    """
    ACTION_CHOICES = [("buy", "Koop"), ("sell", "Verkoop")]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    planet = models.ForeignKey("catalog.Planet", on_delete=models.CASCADE, related_name="transactions")
    action = models.CharField(max_length=4, choices=ACTION_CHOICES)
    quantity = models.PositiveIntegerField(default=1)
    price_credits = models.DecimalField(
        max_digits=14, decimal_places=2, help_text="Prijs PER EENHEID op moment van transactie.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} {self.action} {self.quantity}x {self.planet.planet_name} @ {self.price_credits}"


class PortfolioEntry(models.Model):
    """
    Huidige bezit van een gebruiker in een planeet -- EEN rij per
    user+planet-combinatie, met een quantity die bij elke koop optelt
    (i.p.v. een nieuwe rij, of een geweigerde herhaalde aankoop). Zie de
    docstring bij Transaction voor de reden van dit aandelen-model.

    purchase_price_credits is het GEWOGEN GEMIDDELDE aankoopprijs per
    eenheid (cost-basis) -- bij elke nieuwe aankoop herberekend, bij een
    gedeeltelijke verkoop ongewijzigd gelaten (standaard "average cost"-
    methode, je weet niet welke specifieke eenheden verkocht worden).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="portfolio")
    planet = models.ForeignKey("catalog.Planet", on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)
    acquired_at = models.DateTimeField(auto_now_add=True)
    purchase_price_credits = models.DecimalField(
        max_digits=14, decimal_places=2, help_text="Gewogen gemiddelde aankoopprijs per eenheid.",
    )

    class Meta:
        unique_together = ("user", "planet")

    def __str__(self):
        return f"{self.user.username} -> {self.quantity}x {self.planet.planet_name}"
