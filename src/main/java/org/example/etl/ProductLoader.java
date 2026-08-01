package org.example.etl;

import org.example.model.Product;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Load step: write transformed products into SQLite.
 * <p>
 * The quantity in the spreadsheet is the opening balance, stored as a movement.
 * Re-uploading a corrected workbook replaces that opening row instead of adding
 * to it, so deliveries and usage recorded since the last upload survive.
 */
public final class ProductLoader {
    private static final String UPSERT = """
            INSERT INTO products (name, category, unit, location, supplier, unit_price)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
                category   = COALESCE(excluded.category, category),
                unit       = COALESCE(excluded.unit, unit),
                location   = COALESCE(excluded.location, location),
                supplier   = COALESCE(excluded.supplier, supplier),
                unit_price = COALESCE(excluded.unit_price, unit_price),
                updated_at = datetime('now')
            """;

    private ProductLoader() {
    }

    public record Result(int inserted, int updated) {
    }

    /** Upserts products and their opening stock. */
    public static Result load(Connection conn, List<Product> products) throws SQLException {
        int before = count(conn);

        try (PreparedStatement stmt = conn.prepareStatement(UPSERT)) {
            for (Product p : products) {
                stmt.setString(1, p.name());
                stmt.setString(2, p.category());
                stmt.setString(3, p.unit());
                stmt.setString(4, p.location());
                stmt.setString(5, p.supplier());
                setNullableDouble(stmt, 6, p.unitPrice());
                stmt.addBatch();
            }
            stmt.executeBatch();
        }
        int after = count(conn);

        // same product named twice in the sheet -> last row's quantity wins
        Map<String, Double> openingByName = new LinkedHashMap<>();
        for (Product p : products) {
            if (p.quantity() != null) {
                openingByName.put(p.name().toLowerCase(), p.quantity());
            }
        }

        Map<String, Integer> idsByName = new LinkedHashMap<>();
        try (var stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT id, name FROM products")) {
            while (rs.next()) {
                idsByName.put(rs.getString("name").toLowerCase(), rs.getInt("id"));
            }
        }

        try (PreparedStatement deleteOpening = conn.prepareStatement(
                "DELETE FROM stock_movements WHERE product_id = ? AND reason = 'opening'");
             PreparedStatement insertOpening = conn.prepareStatement(
                     "INSERT INTO stock_movements (product_id, delta, reason) VALUES (?, ?, 'opening')")) {
            for (var entry : openingByName.entrySet()) {
                Integer productId = idsByName.get(entry.getKey());
                deleteOpening.setInt(1, productId);
                deleteOpening.addBatch();
                insertOpening.setInt(1, productId);
                insertOpening.setDouble(2, entry.getValue());
                insertOpening.addBatch();
            }
            deleteOpening.executeBatch();
            insertOpening.executeBatch();
        }

        int inserted = after - before;
        return new Result(inserted, products.size() - inserted);
    }

    private static int count(Connection conn) throws SQLException {
        try (var stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM products")) {
            rs.next();
            return rs.getInt(1);
        }
    }

    private static void setNullableDouble(PreparedStatement stmt, int index, Double value) throws SQLException {
        if (value == null) {
            stmt.setNull(index, java.sql.Types.REAL);
        } else {
            stmt.setDouble(index, value);
        }
    }
}
