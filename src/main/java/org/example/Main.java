package org.example;

import org.example.ui.UploaderFrame;

import javax.swing.*;

public class Main {
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> new UploaderFrame().setVisible(true));
    }
}
