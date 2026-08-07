from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Planet
from .models import PortfolioEntry, Transaction, User
from .serializers import (
    PortfolioEntrySerializer, RegisterSerializer, TransactionSerializer, UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class PortfolioViewSet(viewsets.ReadOnlyModelViewSet):
    """Alleen de portfolio van de ingelogde gebruiker -- nooit die van anderen."""
    serializer_class = PortfolioEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PortfolioEntry.objects.filter(user=self.request.user).select_related("planet")


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """Alleen het transactielogboek van de ingelogde gebruiker."""
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).select_related("planet")


class BuyPlanetView(APIView):
    """
    Koopt een planeet tegen de HUIDIGE market_value_credits. Atomisch +
    select_for_update() op de gebruiker -- zelfde voorzichtigheid als de
    race-condition-fix in sync_planets.py, want dit is de plek waar
    credits daadwerkelijk van hand wisselen.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, planet_id):
        planet = get_object_or_404(Planet, id=planet_id)
        if planet.market_value_credits is None:
            return Response(
                {"detail": "Deze planeet heeft nog geen marktwaarde (nog niet gesynchroniseerd)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=request.user.pk)

            if PortfolioEntry.objects.filter(user=user, planet=planet).exists():
                return Response({"detail": "Je bezit deze planeet al."}, status=status.HTTP_400_BAD_REQUEST)

            price = planet.market_value_credits
            if user.credits_balance < price:
                return Response({"detail": "Onvoldoende credits."}, status=status.HTTP_400_BAD_REQUEST)

            user.credits_balance -= price
            user.save(update_fields=["credits_balance"])
            PortfolioEntry.objects.create(user=user, planet=planet, purchase_price_credits=price)
            Transaction.objects.create(user=user, planet=planet, action="buy", price_credits=price)

        return Response(
            {
                "detail": f"{planet.planet_name} gekocht voor {price} credits.",
                "credits_balance": user.credits_balance,
            },
            status=status.HTTP_201_CREATED,
        )


class SellPlanetView(APIView):
    """Verkoopt een planeet die de gebruiker bezit, tegen de HUIDIGE market_value_credits."""
    permission_classes = [IsAuthenticated]

    def post(self, request, planet_id):
        planet = get_object_or_404(Planet, id=planet_id)

        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=request.user.pk)
            entry = PortfolioEntry.objects.filter(user=user, planet=planet).first()
            if not entry:
                return Response({"detail": "Je bezit deze planeet niet."}, status=status.HTTP_400_BAD_REQUEST)

            price = planet.market_value_credits or entry.purchase_price_credits
            user.credits_balance += price
            user.save(update_fields=["credits_balance"])
            entry.delete()
            Transaction.objects.create(user=user, planet=planet, action="sell", price_credits=price)

        return Response(
            {
                "detail": f"{planet.planet_name} verkocht voor {price} credits.",
                "credits_balance": user.credits_balance,
            },
            status=status.HTTP_200_OK,
        )
