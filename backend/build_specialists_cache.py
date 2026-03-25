"""
Builds specialists_cache.json from Google Places + curated data
Run once to generate the cache, then the FastAPI endpoint serves from it
"""
import requests, json, math

GOOGLE_API_KEY = "AIzaSyDu7FFrIAWyscOUj906OEpLunErqQH-oqw"

def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return round(R * 2 * math.asin(math.sqrt(a)), 2)

def fetch_google_places():
    print("Fetching from Google Places API...")
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.location,places.rating,places.websiteUri,places.types"
    }
    queries = [
        "dermatologist Amman Jordan",
        "skin cancer clinic Amman Jordan",
        "oncologist Amman Jordan",
        "dermoscopy clinic Amman Jordan",
        "melanoma dermatologist Amman",
        "جلدية عمان الاردن",
    ]
    all_results = []
    seen = set()
    for q in queries:
        body = {
            "textQuery": q,
            "languageCode": "en",
            "locationBias": {
                "circle": {
                    "center": {"latitude": 31.9539, "longitude": 35.9106},
                    "radius": 25000.0
                }
            }
        }
        resp = requests.post(url, headers=headers, json=body, timeout=10)
        for p in resp.json().get("places", []):
            name = p.get("displayName", {}).get("text", "")
            if not name or name in seen:
                continue
            seen.add(name)
            all_results.append({
                "name": name,
                "address": p.get("formattedAddress"),
                "phone": p.get("nationalPhoneNumber"),
                "lat": p.get("location", {}).get("latitude"),
                "lng": p.get("location", {}).get("longitude"),
                "website": p.get("websiteUri"),
                "rating": p.get("rating"),
                "clinic": name,
                "specialty": "Dermatology / Skin Cancer",
                "title": "Specialist",
                "source": "google_places",
            })
    print(f"  Google Places: {len(all_results)} unique results")
    return all_results

def get_curated():
    return [
        {
            "name": "Dr. Hannah Naasan",
            "title": "Consultant Dermatologist",
            "specialty": "Dermatology & Venereology, Skin Cancer Surgery, Biopsy, Cryotherapy",
            "clinic": "Dr. Hannah's Clinic — Abdali Hospital",
            "address": "Al-Istethmar St 25, Amman",
            "phone": "+962 79 773 3763",
            "website": "drhannahclinic.com",
            "lat": 31.9639, "lng": 35.9102,
            "source": "curated",
        },
        {
            "name": "Dr. Ammar Batayneh",
            "title": "Board Certified Dermatologist",
            "specialty": "Dermatology, Venereology, Skin Lesion Removal, Dermoscopy",
            "clinic": "Skin Clinic 360",
            "address": "Kamal Junblat, Amman",
            "phone": "+962 79 615 8010",
            "website": "skinclinic360.com",
            "lat": 31.9593, "lng": 35.8771,
            "source": "curated",
        },
        {
            "name": "Dr. Dana Fara'neh",
            "title": "Board Certified Dermatologist",
            "specialty": "Dermatology, Venereology, Skin Lesion Removal, Dermoscopy",
            "clinic": "Skin Clinic 360",
            "address": "Kamal Junblat, Amman",
            "phone": "+962 79 615 8010",
            "website": "skinclinic360.com",
            "lat": 31.9593, "lng": 35.8771,
            "source": "curated",
        },
        {
            "name": "King Hussein Cancer Center",
            "title": "Specialized Cancer Center",
            "specialty": "Skin Cancer, Melanoma, Oncology, Dermatopathology, Surgical Oncology",
            "clinic": "King Hussein Cancer Center (KHCC)",
            "address": "Al Jama'a Street 202, Amman",
            "phone": "+962 6 530 0460",
            "website": "khcc.jo",
            "lat": 31.9730, "lng": 35.8680,
            "source": "curated",
        },
        {
            "name": "Abdali Hospital — Skin Cancer Team",
            "title": "Hospital Dermatology & Plastic Surgery",
            "specialty": "Skin Cancer Surgery, Dermatopathology, Biopsy, Reconstruction",
            "clinic": "Abdali Hospital",
            "address": "Abdali Boulevard, Amman",
            "phone": "+962 6 510 9999",
            "website": "abdali.jo",
            "lat": 31.9784, "lng": 35.9244,
            "source": "curated",
        },
        {
            "name": "Jordan University Hospital — Dermatology",
            "title": "University Hospital Department",
            "specialty": "Dermatology, Skin Cancer, Biopsy, Dermatopathology",
            "clinic": "Jordan University Hospital",
            "address": "Queen Rania Street, Jubeiha, Amman",
            "phone": "+962 6 535 3444",
            "website": "juh.jo",
            "lat": 31.9756, "lng": 35.8702,
            "source": "curated",
        },
    ]

def merge_and_deduplicate(curated, places):
    """Curated takes priority — if same clinic found in Places, enrich curated entry"""
    final = list(curated)
    curated_names = {e["name"].lower() for e in curated}
    curated_phones = {e.get("phone","").replace(" ","") for e in curated if e.get("phone")}

    for p in places:
        name_lower = p["name"].lower()
        phone_clean = (p.get("phone") or "").replace(" ","")
        # Skip if already in curated by name similarity or phone
        is_dup = any(
            name_lower in cn or cn in name_lower
            for cn in curated_names
        ) or (phone_clean and phone_clean in curated_phones)
        if not is_dup:
            final.append(p)

    print(f"  After merge: {len(final)} total specialists")
    return final

def normalize_phone(phone):
    if not phone:
        return None
    import re
    p = re.sub(r'[\s\-\(\)]', '', str(phone))
    if p.startswith('0') and not p.startswith('00'):
        p = '+962' + p[1:]
    elif p.startswith('962') and not p.startswith('+'):
        p = '+' + p
    return p

if __name__ == "__main__":
    curated = get_curated()
    places = fetch_google_places()
    specialists = merge_and_deduplicate(curated, places)

    # Normalize phones
    for s in specialists:
        s["phone"] = normalize_phone(s.get("phone"))
        # Ensure lat/lng are floats
        if s.get("lat"): s["lat"] = float(s["lat"])
        if s.get("lng"): s["lng"] = float(s["lng"])

    # Test distance sort from city center
    center_lat, center_lng = 31.9539, 35.9106
    for s in specialists:
        if s.get("lat") and s.get("lng"):
            s["distance_from_center_km"] = haversine(
                center_lat, center_lng, s["lat"], s["lng"]
            )

    # Save
    with open("specialists_cache.json", "w", encoding="utf-8") as f:
        json.dump(specialists, f, ensure_ascii=False, indent=2)

    print(f"\nFinal cache: {len(specialists)} specialists")
    print("Saved to specialists_cache.json")

    # Print summary
    with_phone = sum(1 for s in specialists if s.get("phone"))
    with_coords = sum(1 for s in specialists if s.get("lat"))
    print(f"  With phone: {with_phone}/{len(specialists)}")
    print(f"  With coords: {with_coords}/{len(specialists)}")
