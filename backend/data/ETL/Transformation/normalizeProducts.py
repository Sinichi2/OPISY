"""
    Transformation step: map whatever the staff called their columns onto the
    five fields the database stores, and turn text into numbers.

    ALIASES is the calibration knob. When a real Panziann workbook shows up with
    a column this does not recognise, add the header to the list below -- that is
    the only edit needed, no code change.
"""
import re

# canonical field -> header spellings seen in the wild (English + Filipino)
ALIASES = {
    "name": ["name", "product", "product name", "item", "item name", "description",
             "pangalan", "produkto", "sangkap", "nagan"],
    "category": ["category", "type", "group", "section", "kategorya", "uri"],
    "unit": ["unit", "uom", "unit of measure", "measure", "packaging", "yunit"],
    "quantity": ["quantity", "qty", "stock", "on hand", "count", "beginning",
                 "dami", "bilang", "stock on hand"],
    "unit_price": ["unit price", "price", "cost", "unit cost", "srp", "amount",
                   "presyo", "halaga"],
    "location": [""], # To be filled
    "supplier": [""], # To be filled
    

}

_LOOKUP = {spelling: field for field, spellings in ALIASES.items() for spelling in spellings}

FIELDS = tuple(ALIASES)

def normalize_header(header):
    """Lowercase, strip punctuation, collapse spaces: 'Unit_Price (PHP)' -> 'unit price'."""
    header = re.sub(r"\(.*?\)", " ", header.lower())
    return re.sub(r"[^a-z0-9]+", " ", header).strip()

def to_number(text):
    """'PHP 1,250.50' -> 1250.5 ; junk -> None."""
    stripped = re.sub(r"[^0-9.\-]", "", text or "")
    try:
        return float(stripped)
    except ValueError:
        return None

def transform(raw_rows):
    """
        Returns (products, skipped) where products is a list of dicts with the
        canonical FIELDS, and skipped counts rows with no recognisable name.
    """
    products, skipped = [], 0
    for raw in raw_rows:
        row = {field: None for field in FIELDS}
        for header, value in raw.items():
            field = _LOOKUP.get(normalize_header(header))
            if field and value:
                row[field] = to_number(value) if field in ("quantity", "unit_price") else value
        if not row["name"]:
            skipped += 1
            continue
        products.append(row)
    return products, skipped
