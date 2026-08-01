package org.example.db;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public final class Database {
    private static final Path DB_PATH = Path.of(System.getProperty("user.home"), "panziann.db");

    private Database() {
    }

    /** Opens the SQLite connection and makes sure the schema exists. */
    public static Connection connect() throws SQLException {
        Connection conn = DriverManager.getConnection("jdbc:sqlite:" + DB_PATH);
        applySchema(conn);
        return conn;
    }

    /** Creates the tables if they are missing. Safe to call on every connection. */
    public static void applySchema(Connection conn) throws SQLException {
        try (Statement stmt = conn.createStatement()) {
            stmt.execute("PRAGMA foreign_keys = ON"); // off by default in SQLite
            for (String sql : readSchemaSql().split(";")) {
                if (!sql.isBlank()) {
                    stmt.execute(sql);
                }
            }
        }
    }

    private static String readSchemaSql() {
        try (InputStream in = Database.class.getResourceAsStream("/schema.sql")) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
