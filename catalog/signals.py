from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import ResourceDiscovery


@receiver(post_save, sender=ResourceDiscovery)
def bump_planet_content_update(sender, instance, **kwargs):
    """
    Een (opnieuw) geverifieerde grondstofvondst is per definitie nieuwe,
    blijvende informatie over de planeet -- precies wat de "update"-tag in
    de catalogus hoort te signaleren. Een niet-geverifieerde vondst
    (is_verified=False, bv. tijdelijk gepauzeerd) telt niet mee.
    """
    if instance.is_verified:
        Planet = instance.planet.__class__
        Planet.objects.filter(pk=instance.planet_id).update(last_content_update_at=timezone.now())
