package org.example.etl;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Extraction step: pull raw rows out of a staff-supplied Excel workbook.
 * <p>
 * Nothing is cleaned here. Every sheet is read, every row comes back as a
 * {@code header -> value} map of strings, exactly as it was typed.
 */
public final class ExcelReader {
    private ExcelReader() {
    }

    /** Reads every sheet in the workbook. One map per data row, keyed by that sheet's header text. */
    public static List<Map<String, String>> readRows(Path path) throws IOException {
        List<Map<String, String>> rows = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();

        try (InputStream in = java.nio.file.Files.newInputStream(path);
             Workbook workbook = WorkbookFactory.create(in)) {
            for (Sheet sheet : workbook) {
                List<String> header = null;
                for (Row row : sheet) {
                    List<String> cells = readCells(row, formatter);

                    if (header == null) {
                        // ponytail: header = first row with 2+ filled cells. Covers the
                        // title/logo rows real sheets have on top. If a sheet ever needs
                        // an explicit header row number, pass it in per sheet.
                        if (cells.stream().filter(c -> !c.isEmpty()).count() >= 2) {
                            header = cells;
                        }
                        continue;
                    }
                    if (cells.stream().anyMatch(c -> !c.isEmpty())) {
                        rows.add(toRowMap(header, cells));
                    }
                }
            }
        }
        return rows;
    }

    private static List<String> readCells(Row row, DataFormatter formatter) {
        List<String> cells = new ArrayList<>();
        int lastCol = row.getLastCellNum(); // -1 if the row is empty
        for (int col = 0; col < lastCol; col++) {
            var cell = row.getCell(col);
            cells.add(cell == null ? "" : formatter.formatCellValue(cell).strip());
        }
        return cells;
    }

    private static Map<String, String> toRowMap(List<String> header, List<String> cells) {
        Map<String, String> row = new LinkedHashMap<>();
        for (int i = 0; i < header.size() && i < cells.size(); i++) {
            row.put(header.get(i), cells.get(i));
        }
        return row;
    }
}
