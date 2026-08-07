"""
Automatische marktsentiment-berekening op basis van echte beursdata.

LET OP: finance.yahoo.com staat niet in de netwerk-whitelist van de
ontwikkel-sandbox -- draai en test dit lokaal/op je server. De logica is
correct volgens yfinance's gedocumenteerde API en apart getest met
gesimuleerde data (zie de testresultaten in de begeleidende toelichting).

FORMULE, in vier stappen:

STAP 1 -- per index, een voortschrijdend gemiddelde i.p.v. twee losse
dagpunten (voorkomt dat 1 rare handelsdag de hele uitkomst domineert):

    recent_avg    = gemiddelde van de laatste 3 slotkoersen
    reference_avg = gemiddelde van 3 slotkoersen, van 6-8 handelsdagen terug
    pct_change    = (recent_avg - reference_avg) / reference_avg

STAP 2 -- gewogen combinatie over regio's/thema's (VS, Europa, Azie gelijk
gewogen; een ruimtevaart-specifieke index zwaarder, want thematisch
relevanter voor dit platform dan brede marktindices):

    gecombineerd_pct_change = gewogen gemiddelde van alle pct_change-waarden

STAP 3 -- demping en begrenzing (zoals eerder):

    ruwe_magnitude = DAMPING_FACTOR * gecombineerd_pct_change
    magnitude_na_cap = clip(ruwe_magnitude, -MAX_MAGNITUDE, +MAX_MAGNITUDE)

STAP 4 -- VIX-angstindicator dempt EXTRA bij verhoogde onzekerheid, los
van of de koersen zelf al bewogen zijn (VIX piekt vaak eerder dan prijzen
dalen):

    vix_surplus  = max(0, VIX_laatst - VIX_BASELINE)
    vix_dempingsfactor = 1 / (1 + VIX_SENSITIVITY * vix_surplus)   # altijd 0-1, nooit versterkend
    finale_magnitude = magnitude_na_cap * vix_dempingsfactor

De VIX-stap dempt UITSLUITEND (nooit versterken bij lage VIX) -- dat is een
bewuste, conservatieve keuze om niet te overfitten op een enkele indicator.
"""
import yfinance as yf

# Elke entry: (ticker, gewicht). Ruimtevaart-ETF telt zwaarder mee omdat het
# thematisch relevanter is voor dit platform dan brede marktindices.
INDICES = {
    "US_NASDAQ": ("^IXIC", 1.0),
    "EU_STOXX50": ("^STOXX50E", 1.0),
    "ASIA_NIKKEI225": ("^N225", 1.0),
    "SPACE_ARKX": ("ARKX", 2.0),
}

VIX_TICKER = "^VIX"
VIX_BASELINE = 19.0       # ruwweg het langjarig gemiddelde van de VIX
VIX_SENSITIVITY = 0.02    # hoe hard de demping oploopt per punt VIX boven baseline

DAMPING_FACTOR = 0.3
MAX_MAGNITUDE = 0.15
RECENT_WINDOW = 3
REFERENCE_OFFSET = 5  # "5 handelsdagen terug", nu als venster i.p.v. 1 dagpunt


def _fetch_index_pct_change(ticker):
    hist = yf.Ticker(ticker).history(period="15d")
    closes = hist["Close"].tolist()
    min_needed = REFERENCE_OFFSET + RECENT_WINDOW
    if len(closes) < min_needed:
        raise ValueError(f"Onvoldoende koersdata voor {ticker} (had {len(closes)}, nodig {min_needed})")

    recent_avg = sum(closes[-RECENT_WINDOW:]) / RECENT_WINDOW
    ref_slice = closes[-(REFERENCE_OFFSET + RECENT_WINDOW):-REFERENCE_OFFSET]
    reference_avg = sum(ref_slice) / len(ref_slice)

    pct_change = (recent_avg - reference_avg) / reference_avg
    return pct_change, recent_avg, reference_avg


def _fetch_vix_dampening():
    """Retourneert (dempingsfactor 0-1, ruwe VIX-waarde). Bij falen: geen
    demping toepassen (factor 1.0) i.p.v. de hele berekening te laten crashen
    -- VIX is een verfijning, geen kernvereiste."""
    try:
        hist = yf.Ticker(VIX_TICKER).history(period="5d")
        vix_latest = hist["Close"].tolist()[-1]
    except Exception:
        return 1.0, None
    surplus = max(0, vix_latest - VIX_BASELINE)
    dampening = 1 / (1 + VIX_SENSITIVITY * surplus)
    return dampening, vix_latest


def fetch_global_sentiment():
    per_index = {}
    errors = []
    for label, (ticker, weight) in INDICES.items():
        try:
            pct_change, recent_avg, reference_avg = _fetch_index_pct_change(ticker)
            per_index[label] = {
                "ticker": ticker, "weight": weight, "pct_change": round(pct_change, 4),
                "recent_avg": round(recent_avg, 2), "reference_avg": round(reference_avg, 2),
            }
        except Exception as e:
            errors.append(f"{label} ({ticker}): {e}")

    if not per_index:
        raise ValueError(f"Geen enkele index kon worden opgehaald: {errors}")

    total_weight = sum(v["weight"] for v in per_index.values())
    combined_pct_change = sum(v["pct_change"] * v["weight"] for v in per_index.values()) / total_weight

    raw_magnitude = DAMPING_FACTOR * combined_pct_change
    magnitude_after_cap = max(-MAX_MAGNITUDE, min(MAX_MAGNITUDE, raw_magnitude))

    vix_dampening, vix_value = _fetch_vix_dampening()
    final_magnitude = magnitude_after_cap * vix_dampening

    details = {
        "per_index": per_index,
        "indices_used": list(per_index.keys()),
        "indices_failed": errors,
        "combined_pct_change": round(combined_pct_change, 4),
        "damping_factor": DAMPING_FACTOR,
        "magnitude_after_cap": round(magnitude_after_cap, 4),
        "vix_value": round(vix_value, 2) if vix_value else None,
        "vix_dampening_factor": round(vix_dampening, 4),
        "final_magnitude": round(final_magnitude, 4),
    }
    return final_magnitude, combined_pct_change, details


if __name__ == "__main__":
    magnitude, pct_change, details = fetch_global_sentiment()
    print(f"Gecombineerde verandering ({', '.join(details['indices_used'])}): {pct_change:+.2%}")
    print(f"VIX: {details['vix_value']} -> dempingsfactor {details['vix_dampening_factor']}")
    print(f"Finale sentiment-magnitude: {magnitude:+.2%}")
    print(details)
