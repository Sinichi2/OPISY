"""
    All user-facing text, one dict, two languages. Add a language by adding its
    code to every entry below -- no other file changes. Add a screen of text by
    adding one key here, then call t("key", lang) wherever it's shown.
"""
DEFAULT_LANG = "en"

STRINGS = {
    # "window_title":    {"en": "Panziann Inventory - Upload"}
    "heading":         {"en": "Upload Excel File",
                         "ilo": "Iyapload ti Excel"},
    "subheading":      {"en": "Press the button, find the file.",
                         "ilo": "Pindutem ti buton, tapno mabiruk mo ta file."},
    "choose_file":     {"en": "CHOOSE FILE",
                         "ilo": "PILIEN TI FILE"},
    "file_picker_title": {"en": "Choose an Excel file",
                           "ilo": "Pilien ti Excel a file"},
    "loading":         {"en": "Loading...",
                         "ilo": "Ur-urayem..."},
    "done":            {"en": "Done!",
                         "ilo": "Nalpasen!"},
    "new_products":    {"en": "new products",
                         "ilo": "baro a produkto"},
    "updated":         {"en": "updated",
                         "ilo": "na-update"},
    "skipped":         {"en": "skipped",
                         "ilo": "nalabsan"},
    "upload_failed":   {"en": "Upload failed.",
                         "ilo": "Saan a nag-upload."},
    "no_products":     {"en": "No products found. The sheet needs a column named Product or Item.",
                         "ilo": "Awan nabirukan a produkto. Kasapulan ti kolum nga Product wenno Item."},
}


def t(key, lang):
    """Looks up text by key + language. Falls back to DEFAULT_LANG, then to the key itself."""
    entry = STRINGS.get(key, {})
    return entry.get(lang) or entry.get(DEFAULT_LANG) or key


if __name__ == "__main__":
    langs = {"en", "ilo"}
    missing = {key: langs - set(translations) for key, translations in STRINGS.items()
               if langs - set(translations)}
    assert not missing, f"missing translations: {missing}"
    print("i18n OK")
