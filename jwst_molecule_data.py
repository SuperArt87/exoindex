"""
Handmatig gecureerde tabel van gepubliceerde JWST/HST moleculdetecties in
exoplaneet-atmosferen. Er bestaat geen gestructureerde publieke API hiervoor
(gecontroleerd tijdens research) -- dit moet dus curatie blijven.

Werkwijze om uit te breiden:
1. Volg de wekelijkse "nieuwe spectra"-aankondigingen op de NASA Exoplanet
   Archive nieuwspagina als trigger.
2. Zoek het bijbehorende paper (meestal binnen dagen op arXiv).
3. Voeg een regel toe met: planeetnaam, moleculen, detectie-significantie,
   instrument, publicatiejaar, bron.

sigma = statistische significantie van de detectie (hoger = zekerder;
>3 sigma wordt algemeen als betrouwbare detectie beschouwd)
"""

JWST_MOLECULE_DATA = {
    "WASP-39 b": dict(
        molecules=["CO2", "H2O", "SO2", "CO"],
        sigma=26.0, instrument="JWST NIRSpec", year=2022,
        source="Identification of carbon dioxide in an exoplanet atmosphere (2022)",
    ),
    "WASP-107 b": dict(
        molecules=["NH3", "CH4", "SO2", "CO", "CO2", "H2O"],
        sigma=None, instrument="JWST", year=2024,
        source="Welbanks et al. 2024",
    ),
    "HAT-P-11 b": dict(
        molecules=["NH3", "H2O", "CH4 (tentative)", "CO2 (tentative)"],
        sigma=None, instrument="JWST", year=2024,
        source="Basilicata et al. 2024",
    ),
    "TOI-270 d": dict(
        molecules=["CH4", "CO2", "H2O", "SO2 (tentative)", "CS2 (tentative)"],
        sigma=9.4, instrument="JWST NIRISS/SOSS + NIRSpec G395H", year=2024,
        source="JWST Reveals CH4, CO2, and H2O in a Metal-rich Miscible Atmosphere (2024)",
    ),
    "HAT-P-12 b": dict(
        molecules=["CO2", "CO", "H2O"],
        sigma=12.2, instrument="JWST NIRSpec + HST WFC3", year=2025,
        source="Detection of CO2, CO, and H2O in the atmosphere of HAT-P-12 b (A&A 2025)",
    ),
    "WASP-18 b": dict(
        molecules=["CO", "H2O", "OH"],
        sigma=None, instrument="JWST NIRISS", year=2026,
        source="Detection of CO, H2O, and OH in WASP-18b with JWST/NIRISS",
    ),
    "WASP-166 b": dict(
        molecules=["H2O", "CO2"],
        sigma=None, instrument="JWST", year=2024,
        source="Detection of H2O and CO2 in the Atmosphere of WASP-166b with JWST",
    ),
    "TRAPPIST-1 e": dict(
        molecules=[],  # nog geen bevestigde detectie; atmosfeer-aanwezigheid zelf nog onbevestigd
        sigma=None, instrument="JWST (in progress)", year=2026,
        source="TRAPPIST-1 JWST-campagne, resultaten nog voorlopig",
    ),
}


def get_molecule_data(planet_name: str):
    """Geeft molecuul-record terug indien bekend, anders None (= UNKNOWN, niet leeg-als-negatief)."""
    return JWST_MOLECULE_DATA.get(planet_name)
