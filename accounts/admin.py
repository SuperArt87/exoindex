from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PortfolioEntry


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "tier", "credits_balance", "is_staff",
                     "is_anonymized", "date_joined")
    list_filter = ("tier", "is_staff", "is_active", "is_anonymized", "marketing_consent")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Platform-specifiek", {"fields": ("tier", "credits_balance")}),
        ("AVG/GDPR", {"fields": (
            "terms_accepted_at", "privacy_policy_version_accepted",
            "marketing_consent", "marketing_consent_updated_at",
            "is_anonymized", "anonymized_at",
        )}),
    )
    readonly_fields = ("is_anonymized", "anonymized_at")


@admin.register(PortfolioEntry)
class PortfolioEntryAdmin(admin.ModelAdmin):
    list_display = ("user", "planet", "purchase_price_credits", "acquired_at")
    list_filter = ("acquired_at",)
    search_fields = ("user__username", "planet__planet_name")
