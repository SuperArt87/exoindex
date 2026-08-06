"""
Haalt exoplaneetdata op uit de NASA Exoplanet Archive via de TAP-service.

LET OP: dit script moet je LOKAAL of op je eigen server draaien -- de
Claude-sandbox waarin dit ontwikkeld is staat het domein
exoplanetarchive.ipac.caltech.edu niet toe in de netwerk-whitelist.
Test dit dus na download; de query zelf is correct en getest tegen de
gedocumenteerde TAP-syntax.
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
    where_clause = "upper(soltype) like '%CONF%'"
    top_clause = f"top {limit} " if limit else ""
    query = f"select {top_clause}{select_clause} from pscomppars where {where_clause}"
    params = {"query": query, "format": "json"}
    resp = requests.get(TAP_URL, params=params, timeout=120)
    resp.raise_for_status()
    return resp.json()  # lijst van dicts, één per planeet


if __name__ == "__main__":
    data = fetch_all_confirmed_planets(limit=20)
    print(f"{len(data)} planeten opgehaald (voorbeeld van eerste 3):")
    for row in data[:3]:
        print(row)
