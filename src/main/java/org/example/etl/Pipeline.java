package org.example.etl;

import org.example.db.Database;
import org.example.model.Product;

import java.io.IOException;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

/**
 * The whole ETL in one call: Excel file in, products in the database out.
 * Used by the UI uploader.
 */
public final class Pipeline {
    private Pipeline() {
    }

    public record Result(int inserted, int updated, int skipped) {
    }

    /** Uses its own connection, opened and closed here. */
    public static Result importExcel(Path path) throws IOException, SQLException {
        try (Connection conn = Database.connect()) {
            return importExcel(path, conn);
        }
    }

    /**
     * Reuses the given connection (the caller owns closing it). Throws
     * IllegalArgumentException("no_products") -- a key into Messages, translated
     * by the caller -- if the workbook has no rows this system can recognise as
     * products.
     */
    public static Result importExcel(Path path, Connection conn) throws IOException, SQLException {
        List<java.util.Map<String, String>> rawRows = ExcelReader.readRows(path);
        ProductNormalizer.Result transformed = ProductNormalizer.transform(rawRows);
        List<Product> products = transformed.products();
        if (products.isEmpty()) {
            throw new IllegalArgumentException("no_products");
        }

        Database.applySchema(conn);
        ProductLoader.Result loaded = ProductLoader.load(conn, products);
        return new Result(loaded.inserted(), loaded.updated(), transformed.skipped());
    }
}
