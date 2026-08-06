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


class PortfolioEntry(models.Model):
    """Eén 'bezit' -- koppelt een gebruiker aan een planeet, met credits-prijs
    op moment van aankoop. Fase-2-voorbereiding voor het handelsplatform."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="portfolio")
    planet = models.ForeignKey("catalog.Planet", on_delete=models.CASCADE)
    acquired_at = models.DateTimeField(auto_now_add=True)
    purchase_price_credits = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        unique_together = ("user", "planet")

    def __str__(self):
        return f"{self.user.username} -> {self.planet.planet_name}"
