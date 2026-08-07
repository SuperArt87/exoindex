from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='quantity',
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AlterField(
            model_name='transaction',
            name='price_credits',
            field=models.DecimalField(decimal_places=2, help_text='Prijs PER EENHEID op moment van transactie.', max_digits=14),
        ),
        migrations.AddField(
            model_name='portfolioentry',
            name='quantity',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='portfolioentry',
            name='purchase_price_credits',
            field=models.DecimalField(decimal_places=2, help_text='Gewogen gemiddelde aankoopprijs per eenheid.', max_digits=14),
        ),
    ]
