package org.example.etl;

import org.example.model.Product;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Transformation step: map whatever the staff called their columns onto the
 * fields the database stores, and turn text into numbers.
 * <p>
 * ALIASES is the calibration knob. When a real Panziann workbook shows up with
 * a column this does not recognise, add the header to the list below -- that is
 * the only edit needed, no code change.
 */
public final class ProductNormalizer {
    // canonical field -> header spellings seen in the wild (English + Filipino)
    private static final Map<String, List<String>> ALIASES = new LinkedHashMap<>();

    static {
        ALIASES.put("name", List.of("name", "product", "product name", "item", "item name", "description",
                "pangalan", "produkto", "sangkap", "nagan"));
        ALIASES.put("category", List.of("category", "type", "group", "section", "kategorya", "uri"));
        ALIASES.put("unit", List.of("unit", "uom", "unit of measure", "measure", "packaging", "yunit"));
        ALIASES.put("location", List.of("location", "storage", "shelf", "lokasyon", "ayan"));
        ALIASES.put("supplier", List.of("supplier", "vendor", "supplier name", "provider", "sapplayer"));
        ALIASES.put("quantity", List.of("quantity", "qty", "stock", "on hand", "count", "beginning",
                "dami", "bilang", "stock on hand"));
        ALIASES.put("unit_price", List.of("unit price", "price", "cost", "unit cost", "srp", "amount",
                "presyo", "halaga"));
        // ALIASES.put("")
    }

    private static final Map<String, String> LOOKUP = new LinkedHashMap<>();

    static {
        ALIASES.forEach((field, spellings) -> spellings.forEach(spelling -> LOOKUP.put(spelling, field)));
    }

    private static final Pattern PARENTHESIZED = Pattern.compile("\\(.*?\\)");
    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9]+");
    private static final Pattern NON_NUMERIC = Pattern.compile("[^0-9.\\-]");

    private ProductNormalizer() {
    }

    public record Result(List<Product> products, int skipped) {
    }

    /** Lowercase, strip punctuation, collapse spaces: "Unit_Price (PHP)" -> "unit price". */
    public static String normalizeHeader(String header) {
        String noParens = PARENTHESIZED.matcher(header.toLowerCase()).replaceAll(" ");
        return NON_ALNUM.matcher(noParens).replaceAll(" ").strip();
    }

    /** "PHP 1,250.50" -> 1250.5 ; junk -> null. */
    public static Double toNumber(String text) {
        if (text == null) {
            return null;
        }
        String stripped = NON_NUMERIC.matcher(text).replaceAll("");
        try {
            return stripped.isEmpty() ? null : Double.valueOf(stripped);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** Returns the recognised products, and how many rows had no recognisable name. */
    public static Result transform(List<Map<String, String>> rawRows) {
        List<Product> products = new ArrayList<>();
        int skipped = 0;

        for (Map<String, String> raw : rawRows) {
            Map<String, String> fields = new LinkedHashMap<>();
            for (var entry : raw.entrySet()) {
                String field = LOOKUP.get(normalizeHeader(entry.getKey()));
                if (field != null && !entry.getValue().isEmpty()) {
                    fields.put(field, entry.getValue());
                }
            }
            String name = fields.get("name");
            if (name == null || name.isEmpty()) {
                skipped++;
                continue;
            }
            products.add(new Product(
                    name,
                    fields.get("category"),
                    fields.get("unit"),
                    fields.get("location"),
                    fields.get("supplier"),
                    toNumber(fields.get("quantity")),
                    toNumber(fields.get("unit_price"))
            ));
        }
        return new Result(products, skipped);
    }
}
