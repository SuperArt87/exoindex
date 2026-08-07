"""
Haalt exoplaneetdata op uit de NASA Exoplanet Archive via de TAP-service.

LIVE GETEST op 2026-08-07 (eerste keer, na deploy op Render) -- de
oorspronkelijke query filterde op `where upper(soltype) like '%CONF%'`,
maar `soltype` bestaat alleen in de `ps`-tabel, NIET in `pscomppars`
(bevestigd via NASA's eigen kolomdocumentatie: API_PS_columns.html).
Resultaat was een ORA-00904 ('SOLTYPE': invalid identifier) van de
TAP-service, waarna de pipeline stil terugviel op demo-sample-data.
Fix: de filter is overbodig -- pscomppars is per definitie al een
samengevatte tabel met een rij per (bevestigde) planeet, in tegenstelling
tot ps (meerdere rijen per planeet, een per publicatie/soltype). Query
zonder WHERE-clausule is opnieuw live getest en geeft correcte data terug.
"""
import requests

TAP_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

# Kolommen uit de pscomppars-tabel die we nodig hebben.
COLUMNS = [
    "pl_name", "hostname", "sy_pnum", "sy_dist",
    "discoverymethod", "disc_year",
    "pl_orbsmax", "pl_orbeccen", "pl_orbincl", "pl_orbper",
    "pl_rade", "pl_masse", "pl_dens", "pl_insol", "pl_eqt",
    "st_spectype", "st_teff", "st_rad", "st_mass", "st_age", "st_lum",
    "ra", "dec",
]


def fetch_all_confirmed_planets(limit=None):
    """Haalt alle bevestigde exoplaneten op met de bovenstaande kolommen."""
    select_clause = ",".join(COLUMNS)
    top_clause = f"top {limit} " if limit else ""
    query = f"select {top_clause}{select_clause} from pscomppars"
    params = {"query": query, "format": "json"}
    resp = requests.get(TAP_URL, params=params, timeout=120)
    resp.raise_for_status()
    return resp.json()  # lijst van dicts, één per planeet


if __name__ == "__main__":
    data = fetch_all_confirmed_planets(limit=20)
    print(f"{len(data)} planeten opgehaald (voorbeeld van eerste 3):")
    for row in data[:3]:
        print(row)
