package org.example.etl;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.example.db.Database;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Run from the IDE (has no main-class runner wired into Maven -- add
 * exec-maven-plugin if `mvn test` needs to run this without an IDE).
 * Fails loudly (an exception) if the ETL breaks.
 */
public final class PipelineSelfCheck {
    public static void main(String[] args) throws Exception {
        File xlsx = File.createTempFile("stock", ".xlsx");
        xlsx.deleteOnExit();

        try (var workbook = new XSSFWorkbook()) {
            var sheet = workbook.createSheet();
            String[][] rows = {
                    {"PANZIANN RESTAURANT", "", "", ""},
                    {"Inventory as of July 2026", "", "", ""},
                    {"Item Name", "Category", "Qty", "Unit Price (PHP)"},
                    {"Tomato", "Vegetable", "12", "PHP 45.50"},
                    {"Olive Oil", "Condiments", "3", "1,250.00"},
                    {"", "", "", ""},
                    {"", "Vegetable", "9", "10"},          // no name -> skipped
                    {"Tomato", "Vegetable", "20", "50"},   // same product again -> update
            };
            for (int r = 0; r < rows.length; r++) {
                var row = sheet.createRow(r);
                for (int c = 0; c < rows[r].length; c++) {
                    row.createCell(c).setCellValue(rows[r][c]);
                }
            }
            try (var out = new java.io.FileOutputStream(xlsx)) {
                workbook.write(out);
            }
        }

        try (Connection conn = DriverManager.getConnection("jdbc:sqlite::memory:")) {
            Database.applySchema(conn);

            Pipeline.Result first = Pipeline.importExcel(xlsx.toPath(), conn);
            check(first.inserted() == 2 && first.updated() == 1 && first.skipped() == 1,
                    "first import: " + first);

            var tomato = stock(conn, "tomato"); // name match ignores case
            check(tomato.quantity == 20, "tomato quantity should be last row's 20: " + tomato.quantity);
            check(tomato.unitPrice == 50, "tomato price should be 50: " + tomato.unitPrice);

            var oil = stock(conn, "Olive Oil");
            check(oil.unitPrice == 1250.0, "comma should be stripped: " + oil.unitPrice);

            // a delivery and a day of cooking, recorded after the upload
            move(conn, tomato.id, 6, "delivery");
            move(conn, tomato.id, -4, "usage");
            check(stock(conn, "Tomato").quantity == 22, "22 after delivery+usage");

            // re-uploading the same file corrects the opening balance without
            // duplicating products or double-counting the movements since
            Pipeline.Result second = Pipeline.importExcel(xlsx.toPath(), conn);
            check(second.inserted() == 0 && second.updated() == 3, "re-import: " + second);
            check(stock(conn, "Tomato").quantity == 22, "still 22 after re-upload");

            // the reason list is enforced by the database, not by Java
            try {
                move(conn, tomato.id, 1, "lol");
                throw new AssertionError("bad reason should have been rejected");
            } catch (SQLException expected) {
                // constraint violation, as expected
            }
        }

        System.out.println("ETL OK");
    }

    private record Stock(int id, double quantity, double unitPrice) {
    }

    private static Stock stock(Connection conn, String name) throws SQLException {
        try (var stmt = conn.prepareStatement(
                "SELECT id, quantity, unit_price FROM current_stock WHERE name = ? COLLATE NOCASE")) {
            stmt.setString(1, name);
            try (ResultSet rs = stmt.executeQuery()) {
                rs.next();
                return new Stock(rs.getInt("id"), rs.getDouble("quantity"), rs.getDouble("unit_price"));
            }
        }
    }

    private static void move(Connection conn, int productId, double delta, String reason) throws SQLException {
        try (var stmt = conn.prepareStatement(
                "INSERT INTO stock_movements (product_id, delta, reason) VALUES (?, ?, ?)")) {
            stmt.setInt(1, productId);
            stmt.setDouble(2, delta);
            stmt.setString(3, reason);
            stmt.execute();
        }
    }

    private static void check(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError(message);
        }
    }
}
