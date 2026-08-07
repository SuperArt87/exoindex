from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    BuyPlanetView, MeView, PortfolioViewSet, RegisterView, SellPlanetView, TransactionViewSet,
)

router = DefaultRouter()
router.register("portfolio", PortfolioViewSet, basename="portfolio")
router.register("transactions", TransactionViewSet, basename="transaction")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("planets/<int:planet_id>/buy/", BuyPlanetView.as_view(), name="planet-buy"),
    path("planets/<int:planet_id>/sell/", SellPlanetView.as_view(), name="planet-sell"),
] + router.urls
