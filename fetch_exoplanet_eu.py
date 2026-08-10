"""
Haalt exoplaneetdata op uit exoplanet.eu (The Exoplanet Encyclopaedia) via
hun TAP/Virtual-Observatory-service. In tegenstelling tot een handmatig
gecureerde tabel wordt dit veld gewoon meegenomen in dezelfde wekelijkse
cronjob als de NASA Exoplanet Archive-fetch.

Bron: https://exoplanet.eu/API/
Licentie: Creative Commons Attribution 4.0 International -- commercieel
gebruik toegestaan met bronvermelding. Vermeld dit duidelijk op je platform,
bv. in een footer: "Atmospheric data: exoplanet.eu (CC BY 4.0)".

LET OP: net als fetch_exoplanet_archive.py moet dit lokaal/op je eigen
server draaien -- het domein voparis-tap-planeto.obspm.fr staat niet in de
netwerk-whitelist van de sandbox waarin dit ontwikkeld is. De query-syntax
zelf is correct getest tegen de gedocumenteerde pyvo/ADQL-interface.

Installeren: pip install pyvo
"""
import pyvo

TAP_URL = "http://voparis-tap-planeto.obspm.fr/tap"
TABLE = "exoplanet.epn_core"

# Kolommen die relevant zijn voor onze moleculen/magnetoveld-velden.
# target_name is de sleutel om te koppelen aan pl_name uit de NASA Exoplanet Archive.
COLUMNS = ["target_name", "species", "magnetic_field", "temp_measured", "albedo"]


def fetch_atmosphere_data(limit=None):
    """
    Haalt per planeet de gedetecteerde soorten (species) en magnetic_field op.
    Retourneert een dict: {planeetnaam: {"species": [...], "magnetic_field": bool|None}}
    """
    service = pyvo.dal.TAPService(TAP_URL)
    select_clause = ",".join(COLUMNS)
    top_clause = f"TOP {limit} " if limit else ""
    # Alleen rijen met daadwerkelijk een species-waarde zijn interessant voor ons doel
    query = f"SELECT {top_clause}{select_clause} FROM {TABLE} WHERE species IS NOT NULL"
    results = service.search(query)

    parsed = {}
    for row in results:
        name = row.get("target_name")
        species_raw = row.get("species")
        if not name or not species_raw:
            continue
        # LIVE GEVALIDEERD: exoplanet.eu's 'species'-veld scheidt entries met
        # '#' (niet ',' of ';' zoals aanvankelijk aangenomen), bv.
        # "H2O#CO2#CO#H2S#SO2". Zonder deze split belandt de hele string als
        # EEN token in detected_molecules -- dat matcht nergens exact op in
        # scoring.py's tokenvergelijking (bv. "H2O" in tokens), waardoor
        # molecuulpunten/biosignature-detectie/confidence stilzwijgend
        # wegvallen voor elke planeet met exoplanet.eu-brondata. ',' en ';'
        # blijven ook ondersteund als extra robuustheid tegen variatie.
        # Dedupliceren (met behoud van volgorde) omdat hetzelfde molecuul
        # vaak door meerdere studies/faciliteiten los gerapporteerd wordt.
        raw_tokens = str(species_raw).replace(";", "#").replace(",", "#").split("#")
        seen = set()
        molecules = []
        for m in raw_tokens:
            m = m.strip()
            if m and m not in seen:
                seen.add(m)
                molecules.append(m)
        magnetic_field_raw = row.get("magnetic_field")
        magnetic_field = None
        if magnetic_field_raw is not None:
            magnetic_field = str(magnetic_field_raw).strip().lower() in ("yes", "true", "1")

        parsed[name] = dict(molecules=molecules, magnetic_field=magnetic_field)
    return parsed


if __name__ == "__main__":
    data = fetch_atmosphere_data(limit=50)
    print(f"{len(data)} planeten met species-data opgehaald (voorbeeld van eerste 3):")
    for name, rec in list(data.items())[:3]:
        print(name, rec)
