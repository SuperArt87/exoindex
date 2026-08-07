from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import PortfolioEntry, Transaction, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User(username=validated_data["username"], email=validated_data.get("email", ""))
        user.set_password(validated_data["password"])
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "tier", "credits_balance", "date_joined"]
        read_only_fields = fields


class PortfolioEntrySerializer(serializers.ModelSerializer):
    planet_name = serializers.CharField(source="planet.planet_name", read_only=True)
    current_market_value_credits = serializers.DecimalField(
        source="planet.market_value_credits", max_digits=14, decimal_places=2,
        read_only=True, allow_null=True,
    )

    class Meta:
        model = PortfolioEntry
        fields = [
            "id", "planet", "planet_name", "purchase_price_credits",
            "current_market_value_credits", "acquired_at",
        ]


class TransactionSerializer(serializers.ModelSerializer):
    planet_name = serializers.CharField(source="planet.planet_name", read_only=True)

    class Meta:
        model = Transaction
        fields = ["id", "planet", "planet_name", "action", "price_credits", "created_at"]
