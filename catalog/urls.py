from rest_framework.routers import DefaultRouter
from .views import PlanetViewSet

router = DefaultRouter()
router.register("planets", PlanetViewSet, basename="planet")

urlpatterns = router.urls
