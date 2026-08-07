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


def _parse_quantity(raw, default):
    """Valideert de optionele quantity-parameter uit een koop/verkoop-request."""
    if raw is None:
        return default, None
    try:
        quantity = int(raw)
    except (TypeError, ValueError):
        return None, "quantity moet een geheel getal zijn."
    if quantity < 1:
        return None, "quantity moet minimaal 1 zijn."
    return quantity, None


class BuyPlanetView(APIView):
    """
    Koopt N eenheden van een planeet tegen de HUIDIGE market_value_credits
    per eenheid. Aandelen-model (zie de docstring bij het Transaction-model
    in accounts/models.py): geen bovengrens, een gebruiker kan zoveel
    eenheden kopen als de overtuiging (en credits) toelaten. Herhaalde
    aankopen tellen op in PortfolioEntry.quantity i.p.v. geweigerd te
    worden, met een herberekend gewogen gemiddelde als cost-basis.

    Atomisch + select_for_update() op de gebruiker -- zelfde voorzichtigheid
    als de race-condition-fix in sync_planets.py, want dit is de plek waar
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

        quantity, error = _parse_quantity(request.data.get("quantity"), default=1)
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        price_per_unit = planet.market_value_credits
        total_price = price_per_unit * quantity

        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=request.user.pk)

            if user.credits_balance < total_price:
                return Response({"detail": "Onvoldoende credits."}, status=status.HTTP_400_BAD_REQUEST)

            user.credits_balance -= total_price
            user.save(update_fields=["credits_balance"])

            entry, created = PortfolioEntry.objects.select_for_update().get_or_create(
                user=user, planet=planet,
                defaults={"quantity": quantity, "purchase_price_credits": price_per_unit},
            )
            if not created:
                # Gewogen gemiddelde cost-basis bijwerken met deze nieuwe aankoop.
                total_units = entry.quantity + quantity
                entry.purchase_price_credits = (
                    (entry.purchase_price_credits * entry.quantity) + total_price
                ) / total_units
                entry.quantity = total_units
                entry.save(update_fields=["quantity", "purchase_price_credits"])

            Transaction.objects.create(
                user=user, planet=planet, action="buy", quantity=quantity, price_credits=price_per_unit,
            )

        return Response(
            {
                "detail": f"{quantity}x {planet.planet_name} gekocht voor {total_price} credits ({price_per_unit}/stuk).",
                "credits_balance": user.credits_balance,
                "quantity_owned": entry.quantity,
            },
            status=status.HTTP_201_CREATED,
        )


class SellPlanetView(APIView):
    """
    Verkoopt N eenheden van een planeet die de gebruiker bezit, tegen de
    HUIDIGE market_value_credits per eenheid. Zonder quantity-parameter
    wordt de VOLLEDIGE positie verkocht (praktische default). Bij een
    gedeeltelijke verkoop blijft de gewogen gemiddelde cost-basis
    ongewijzigd (standaard "average cost"-methode).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, planet_id):
        planet = get_object_or_404(Planet, id=planet_id)

        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=request.user.pk)
            entry = PortfolioEntry.objects.select_for_update().filter(user=user, planet=planet).first()
            if not entry:
                return Response({"detail": "Je bezit deze planeet niet."}, status=status.HTTP_400_BAD_REQUEST)

            quantity, error = _parse_quantity(request.data.get("quantity"), default=entry.quantity)
            if error:
                return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)
            if quantity > entry.quantity:
                return Response(
                    {"detail": f"Je bezit maar {entry.quantity}x {planet.planet_name}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            price_per_unit = planet.market_value_credits or entry.purchase_price_credits
            total_price = price_per_unit * quantity

            user.credits_balance += total_price
            user.save(update_fields=["credits_balance"])

            if quantity == entry.quantity:
                entry.delete()
                remaining = 0
            else:
                entry.quantity -= quantity
                entry.save(update_fields=["quantity"])
                remaining = entry.quantity

            Transaction.objects.create(
                user=user, planet=planet, action="sell", quantity=quantity, price_credits=price_per_unit,
            )

        return Response(
            {
                "detail": f"{quantity}x {planet.planet_name} verkocht voor {total_price} credits ({price_per_unit}/stuk).",
                "credits_balance": user.credits_balance,
                "quantity_owned": remaining,
            },
            status=status.HTTP_200_OK,
        )
