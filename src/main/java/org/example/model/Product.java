package org.example.model;

public record Product(String name, String category, String unit, String location, String supplier,
                       Double quantity, Double unitPrice) {
}
