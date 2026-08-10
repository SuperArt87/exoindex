import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PriceHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('market_value_credits', models.DecimalField(decimal_places=2, max_digits=14)),
                ('recorded_at', models.DateTimeField(auto_now_add=True)),
                ('planet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='price_history', to='catalog.planet')),
            ],
            options={
                'verbose_name_plural': 'price history',
                'ordering': ['-recorded_at'],
            },
        ),
        migrations.AddIndex(
            model_name='pricehistory',
            index=models.Index(fields=['planet', 'recorded_at'], name='ph_planet_recorded_idx'),
        ),
    ]
