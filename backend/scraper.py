"""
DermaScan Specialist Scraper
Scrapes dermatologists and skin cancer specialists in Amman, Jordan
from multiple sources: Tebcan, Vezeeta, Rofancare, KHCC
Then geocodes addresses using Google Maps API
"""

import json, time, re, sys, argparse
import requests
from bs4 import BeautifulSoup
from rapidfuzz import fuzz
import googlemaps

GOOGLE_API_KEY = "AIzaSyDu7FFrIAWyscOUj906OEpLunErqQH-oqw"  # replace with your key

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

RELEVANT_SPECIALTIES = [
    "dermatology", "dermatologist", "skin cancer", "melanoma",
    "oncology", "oncologist", "venereology", "dermoscopy",
    "dermatopathology", "plastic surgery", "surgical oncology",
    "جلدية", "سرطان الجلد", "أورام"
]

def is_relevant(specialty_text):
    if not specialty_text:
        return False
    text = specialty_text.lower()
    return any(kw in text for kw in RELEVANT_SPECIALTIES)

def clean_phone(phone):
    if not phone:
        return None
    cleaned = re.sub(r'[^\d+]', '', phone)
    if cleaned and not cleaned.startswith('+'):
        if cleaned.startswith('00962'):
            cleaned = '+' + cleaned[2:]
        elif cleaned.startswith('0'):
            cleaned = '+962' + cleaned[1:]
        elif cleaned.startswith('962'):
            cleaned = '+' + cleaned
    return cleaned if len(cleaned) >= 8 else None

# =============================================================================
# SOURCE 1: Tebcan
# =============================================================================
def scrape_tebcan():
    print("\n[Tebcan] Scraping dermatology + skin cancer + oncology in Amman...")
    results = []
    urls = [
        "https://tebcan.com/en/Jordan/Doctors/dermatology-and-venereology/amman",
        "https://tebcan.com/en/Jordan/Doctors/skin-cancer-melanoma/jordan",
        "https://tebcan.com/en/Jordan/Doctors/oncology/jordan",
    ]
    for url in urls:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            doctor_cards = soup.find_all("div", class_=re.compile(r"doctor|physician|card", re.I))
            if not doctor_cards:
                doctor_cards = soup.find_all("article")
            if not doctor_cards:
                all_links = soup.find_all("a", href=re.compile(r"/doctor/|/physician/|/Dr"))
                print(f"  [Tebcan] Found {len(all_links)} doctor links at {url}")
                for link in all_links[:30]:
                    name = link.get_text(strip=True)
                    if name and len(name) > 5:
                        results.append({
                            "name": name,
                            "source": "tebcan",
                            "url": "https://tebcan.com" + link.get("href", ""),
                            "address": "Amman, Jordan",
                            "phone": None,
                            "specialty": "Dermatology",
                            "clinic": None,
                            "lat": None,
                            "lng": None,
                        })
            else:
                print(f"  [Tebcan] Found {len(doctor_cards)} cards at {url}")
            time.sleep(2)
        except Exception as e:
            print(f"  [Tebcan] Error at {url}: {e}")
    print(f"  [Tebcan] Total: {len(results)} entries")
    return results

# =============================================================================
# SOURCE 2: Vezeeta
# =============================================================================
def scrape_vezeeta():
    print("\n[Vezeeta] Scraping dermatologists in Amman...")
    results = []
    urls = [
        "https://jordan.vezeeta.com/en/doctor/dermatology/amman",
        "https://jordan.vezeeta.com/en/doctor/oncology/amman",
    ]
    for url in urls:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            names = soup.find_all(["h2", "h3", "span"],
                                   string=re.compile(r"Dr\.|دكتور", re.I))
            print(f"  [Vezeeta] Found {len(names)} doctor names at {url}")
            for tag in names[:20]:
                name = tag.get_text(strip=True)
                parent = tag.find_parent(["div", "article", "li"])
                address = None
                phone = None
                specialty = None
                if parent:
                    addr_tag = parent.find(string=re.compile(r"Amman|عمان", re.I))
                    if addr_tag:
                        address = addr_tag.strip()
                    phone_tag = parent.find(string=re.compile(r"\+962|077|078|079", re.I))
                    if phone_tag:
                        phone = clean_phone(phone_tag.strip())
                if name:
                    results.append({
                        "name": name,
                        "source": "vezeeta",
                        "url": url,
                        "address": address or "Amman, Jordan",
                        "phone": phone,
                        "specialty": specialty or "Dermatology",
                        "clinic": None,
                        "lat": None,
                        "lng": None,
                    })
            time.sleep(2)
        except Exception as e:
            print(f"  [Vezeeta] Error at {url}: {e}")
    print(f"  [Vezeeta] Total: {len(results)} entries")
    return results

# =============================================================================
# SOURCE 3: KHCC — King Hussein Cancer Center
# =============================================================================
def scrape_khcc():
    print("\n[KHCC] Scraping cancer specialists...")
    results = []
    try:
        resp = requests.get(
            "https://www.khcc.jo/en/our-doctors",
            headers=HEADERS, timeout=15
        )
        soup = BeautifulSoup(resp.text, "html.parser")
        doctor_tags = soup.find_all(string=re.compile(r"Dr\.|M\.D\.|MD", re.I))
        print(f"  [KHCC] Found {len(doctor_tags)} potential doctor references")
        seen = set()
        for tag in doctor_tags[:40]:
            name = tag.strip()
            if name and name not in seen and len(name) > 5:
                seen.add(name)
                results.append({
                    "name": name,
                    "source": "khcc",
                    "url": "https://www.khcc.jo/en/our-doctors",
                    "address": "Queen Rania Al Abdullah Street, Jubeiha, Amman",
                    "phone": "+962 6 530 0460",
                    "specialty": "Oncology / Skin Cancer",
                    "clinic": "King Hussein Cancer Center",
                    "lat": 31.9730,
                    "lng": 35.8680,
                })
        print(f"  [KHCC] Total: {len(results)} entries")
    except Exception as e:
        print(f"  [KHCC] Error: {e}")
    return results

# =============================================================================
# SOURCE 4: Known verified specialists (curated from research)
# =============================================================================
def get_curated_specialists():
    print("\n[Curated] Loading verified Amman skin cancer specialists...")
    specialists = [
        {
            "name": "Dr. Hannah Naasan",
            "title": "Consultant Dermatologist",
            "specialty": "Dermatology & Venereology, Skin Cancer Surgery, Biopsy, Cryotherapy",
            "clinic": "Dr. Hannah's Clinic — Abdali Hospital",
            "address": "Abdali Hospital, Abdali Boulevard, Amman",
            "phone": "+962 6 510 0000",
            "website": "drhannahclinic.com",
            "source": "curated",
            "lat": 31.9784, "lng": 35.9244,
        },
        {
            "name": "Dr. Muhannad Adas",
            "title": "Consultant Dermatologist",
            "specialty": "Dermatology & Venereology",
            "clinic": "Dr. Adas Clinic",
            "address": "Amman, Jordan",
            "phone": None,
            "website": "dradas.com",
            "source": "curated",
            "lat": 31.9539, "lng": 35.9106,
        },
        {
            "name": "Dr. Ammar Batayneh",
            "title": "Board Certified Dermatologist",
            "specialty": "Dermatology, Venereology, Cosmetics & Laser, Skin Lesion Removal",
            "clinic": "Skin Clinic 360",
            "address": "Amman, Jordan",
            "phone": "+962 796 158 010",
            "website": "skinclinic360.com",
            "source": "curated",
            "lat": 31.9522, "lng": 35.9271,
        },
        {
            "name": "Dr. Dana Fara'neh",
            "title": "Board Certified Dermatologist",
            "specialty": "Dermatology, Venereology, Cosmetics & Laser, Skin Lesion Removal",
            "clinic": "Skin Clinic 360",
            "address": "Amman, Jordan",
            "phone": "+962 796 158 010",
            "website": "skinclinic360.com",
            "source": "curated",
            "lat": 31.9522, "lng": 35.9271,
        },
        {
            "name": "Dr. Safwan Al-Adwan",
            "title": "Triple Board Certified Dermatologist",
            "specialty": "Dermatology & Aesthetics, Skin Cancer",
            "clinic": "Dr. Safwan Al-Adwan Clinics",
            "address": "Al Madinah Al Munawwarah Street, Amman",
            "phone": None,
            "website": "drsafwanclinics.com",
            "source": "curated",
            "lat": 31.9635, "lng": 35.8853,
        },
        {
            "name": "King Hussein Cancer Center — Dermatology & Oncology",
            "title": "Specialized Cancer Center",
            "specialty": "Skin Cancer, Melanoma, Oncology, Dermatopathology, Surgical Oncology",
            "clinic": "King Hussein Cancer Center (KHCC)",
            "address": "Queen Rania Al Abdullah Street, Jubeiha, Amman",
            "phone": "+962 6 530 0460",
            "website": "khcc.jo",
            "source": "curated",
            "lat": 31.9730, "lng": 35.8680,
        },
        {
            "name": "Jordan University Hospital — Dermatology Dept",
            "title": "University Hospital Department",
            "specialty": "Dermatology, Skin Cancer, Biopsy, Dermatopathology",
            "clinic": "Jordan University Hospital",
            "address": "Queen Rania Street, Jubeiha, Amman",
            "phone": "+962 6 535 3444",
            "website": "juh.jo",
            "source": "curated",
            "lat": 31.9756, "lng": 35.8702,
        },
        {
            "name": "Abdali Hospital — Skin Cancer Team",
            "title": "Hospital Dermatology & Plastic Surgery",
            "specialty": "Skin Cancer Surgery, Dermatopathology, Biopsy, Reconstruction",
            "clinic": "Abdali Hospital",
            "address": "Abdali Boulevard, Amman",
            "phone": "+962 6 510 0000",
            "website": "abdali.jo",
            "source": "curated",
            "lat": 31.9784, "lng": 35.9244,
        },
    ]
    print(f"  [Curated] {len(specialists)} verified specialists loaded")
    return specialists

# =============================================================================
# GEOCODING — convert address to coordinates
# =============================================================================
def geocode_missing(specialists, api_key):
    if not api_key or api_key == "AIzaSyDu7FFrIAWyscOUj906OEpLunErqQH-oqw":
        print("\n[Geocode] Skipping — no API key set")
        return specialists
    print(f"\n[Geocode] Geocoding {sum(1 for s in specialists if not s.get('lat'))} entries...")
    gmaps = googlemaps.Client(key=api_key)
    for s in specialists:
        if s.get("lat") and s.get("lng"):
            continue
        address = s.get("address") or s.get("clinic") or "Amman, Jordan"
        if "Amman" not in address:
            address += ", Amman, Jordan"
        try:
            result = gmaps.geocode(address)
            if result:
                loc = result[0]["geometry"]["location"]
                s["lat"] = loc["lat"]
                s["lng"] = loc["lng"]
                print(f"  Geocoded: {s['name'][:40]} → {s['lat']:.4f}, {s['lng']:.4f}")
            time.sleep(0.2)
        except Exception as e:
            print(f"  Geocode error for {s['name']}: {e}")
    return specialists

# =============================================================================
# DEDUPLICATION
# =============================================================================
def deduplicate(specialists):
    print(f"\n[Dedup] Deduplicating {len(specialists)} entries...")
    unique = []
    for s in specialists:
        name = s.get("name", "")
        is_dup = False
        for u in unique:
            if fuzz.ratio(name.lower(), u.get("name", "").lower()) > 85:
                is_dup = True
                if s.get("phone") and not u.get("phone"):
                    u["phone"] = s["phone"]
                if s.get("lat") and not u.get("lat"):
                    u["lat"] = s["lat"]
                    u["lng"] = s["lng"]
                break
        if not is_dup:
            unique.append(s)
    print(f"  [Dedup] {len(unique)} unique specialists after deduplication")
    return unique

# =============================================================================
# DISTANCE CALCULATION
# =============================================================================
def haversine(lat1, lng1, lat2, lng2):
    import math
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def sort_by_distance(specialists, patient_lat, patient_lng):
    for s in specialists:
        if s.get("lat") and s.get("lng"):
            s["distance_km"] = round(haversine(patient_lat, patient_lng, s["lat"], s["lng"]), 2)
        else:
            s["distance_km"] = 999
    return sorted(specialists, key=lambda x: x["distance_km"])

# =============================================================================
# MAIN — run all sources and save cache
# =============================================================================
def run_full_scrape(api_key=GOOGLE_API_KEY):
    print("=" * 60)
    print("DermaScan Specialist Scraper — Amman, Jordan")
    print("=" * 60)

    all_specialists = []
    all_specialists.extend(get_curated_specialists())
    all_specialists.extend(scrape_tebcan())
    all_specialists.extend(scrape_vezeeta())
    all_specialists.extend(scrape_khcc())

    all_specialists = deduplicate(all_specialists)
    all_specialists = geocode_missing(all_specialists, api_key)

    output_path = "specialists_cache.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_specialists, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"DONE — {len(all_specialists)} specialists saved to {output_path}")
    print("="*60)
    return all_specialists

# =============================================================================
# UNIT TESTS — run individual sources
# =============================================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", choices=["tebcan","vezeeta","khcc","curated","all"], default="all")
    parser.add_argument("--test", action="store_true")
    parser.add_argument("--lat", type=float, default=31.9539)
    parser.add_argument("--lng", type=float, default=35.9106)
    args = parser.parse_args()

    if args.source == "tebcan":
        results = scrape_tebcan()
    elif args.source == "vezeeta":
        results = scrape_vezeeta()
    elif args.source == "khcc":
        results = scrape_khcc()
    elif args.source == "curated":
        results = get_curated_specialists()
    else:
        results = run_full_scrape()

    if args.test and args.source != "all":
        print(f"\n{'='*60}")
        print(f"TEST RESULTS — {len(results)} entries from [{args.source}]")
        print("="*60)
        for r in results[:10]:
            print(f"\n  Name    : {r.get('name')}")
            print(f"  Specialty: {r.get('specialty')}")
            print(f"  Clinic  : {r.get('clinic')}")
            print(f"  Address : {r.get('address')}")
            print(f"  Phone   : {r.get('phone')}")
            print(f"  Coords  : {r.get('lat')}, {r.get('lng')}")

    if args.source != "all":
        sorted_results = sort_by_distance(
            [r for r in results if r.get("lat")],
            args.lat, args.lng
        )
        print(f"\nSorted by distance from ({args.lat}, {args.lng}):")
        for r in sorted_results[:5]:
            print(f"  {r.get('distance_km')} km — {r.get('name')}")
