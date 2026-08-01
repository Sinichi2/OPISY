package org.example.i18n;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * All user-facing text, one map, two languages. Add a language by adding its
 * code to every entry below -- no other file changes. Add a screen of text by
 * adding one key here, then call get(key, lang) wherever it's shown.
 */
public final class Messages {
    public static final String DEFAULT_LANG = "en";

    private static final Map<String, Map<String, String>> STRINGS = new LinkedHashMap<>();

    private static void put(String key, String en, String ilo) {
        Map<String, String> translations = new LinkedHashMap<>();
        translations.put("en", en);
        translations.put("ilo", ilo);
        STRINGS.put(key, translations);
    }

    static {
        put("window_title", "Panziann Inventory - Upload", "Panziann Imbentaryo - Iyapload");
        put("heading", "Upload Excel File", "Iyapload ti Excel");
        put("subheading", "Press the button, find the file.", "Pindutem ti buton, tapno mabiruk mo ta file.");
        put("choose_file", "CHOOSE FILE", "PILIEN TI FILE");
        put("file_picker_title", "Choose an Excel file", "Pilien ti Excel a file");
        put("loading", "Loading...", "Ur-urayem...");
        put("done", "Done!", "Nalpasen!");
        put("new_products", "new products", "baro a produkto");
        put("updated", "updated", "na-update");
        put("skipped", "skipped", "nalabsan");
        put("upload_failed", "Upload failed.", "Saan a nag-upload.");
        put("no_products", "No products found. The sheet needs a column named Product or Item.",
                "Awan nabirukan a produkto. Kasapulan ti kolum nga Product wenno Item.");
    }

    private Messages() {
    }

    /** Looks up text by key + language. Falls back to DEFAULT_LANG, then to the key itself. */
    public static String t(String key, String lang) {
        Map<String, String> entry = STRINGS.get(key);
        if (entry == null) {
            return key;
        }
        return entry.getOrDefault(lang, entry.getOrDefault(DEFAULT_LANG, key));
    }

    public static void main(String[] args) {
        for (var entry : STRINGS.entrySet()) {
            if (!entry.getValue().containsKey("en") || !entry.getValue().containsKey("ilo")) {
                throw new AssertionError("missing translation for key: " + entry.getKey());
            }
        }
        System.out.println("i18n OK");
    }
}
