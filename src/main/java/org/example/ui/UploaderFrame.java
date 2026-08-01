package org.example.ui;

import org.example.etl.Pipeline;
import org.example.i18n.Messages;

import javax.swing.*;
import java.awt.*;
import java.io.File;

import static org.example.i18n.Messages.t;

/**
 * Uploader screen: one button, staff picks their Excel file, system says what
 * happened in plain words. Pictures and the rest of the inventory UI come later.
 */
public final class UploaderFrame extends JFrame {
    private static final Font BIG = new Font("Segoe UI", Font.BOLD, 22);
    private static final Font PLAIN = new Font("Segoe UI", Font.PLAIN, 14);

    private String lang = "en";
    private Object[] lastResult; // {true, inserted, updated, skipped} or {false, errorKey} -- redrawn on language switch

    private final JLabel heading = new JLabel();
    private final JLabel subheading = new JLabel();
    private final JButton chooseButton = new JButton();
    private final JLabel status = new JLabel();
    private final JButton enButton = new JButton("EN");
    private final JButton iloButton = new JButton("ILO");

    public UploaderFrame() {
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(560, 420);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout());

        JPanel langBar = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        enButton.addActionListener(e -> setLang("en"));
        iloButton.addActionListener(e -> setLang("ilo"));
        langBar.add(enButton);
        langBar.add(iloButton);
        add(langBar, BorderLayout.NORTH);

        JPanel center = new JPanel();
        center.setLayout(new BoxLayout(center, BoxLayout.Y_AXIS));
        heading.setFont(BIG);
        heading.setAlignmentX(Component.CENTER_ALIGNMENT);
        subheading.setFont(PLAIN);
        subheading.setAlignmentX(Component.CENTER_ALIGNMENT);
        chooseButton.setFont(BIG);
        chooseButton.setBackground(new Color(0x1b7f3b));
        chooseButton.setForeground(Color.WHITE);
        chooseButton.setAlignmentX(Component.CENTER_ALIGNMENT);
        chooseButton.addActionListener(e -> upload());
        status.setFont(PLAIN);
        status.setAlignmentX(Component.CENTER_ALIGNMENT);
        status.setHorizontalAlignment(SwingConstants.CENTER);

        center.add(Box.createVerticalStrut(30));
        center.add(heading);
        center.add(Box.createVerticalStrut(10));
        center.add(subheading);
        center.add(Box.createVerticalStrut(30));
        center.add(chooseButton);
        center.add(Box.createVerticalStrut(20));
        center.add(status);
        add(center, BorderLayout.CENTER);

        setLang(lang);
    }

    private void upload() {
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle(t("file_picker_title", lang));
        chooser.setFileFilter(new javax.swing.filechooser.FileNameExtensionFilter(
                "Excel file", "xlsx", "xlsm"));
        if (chooser.showOpenDialog(this) != JFileChooser.APPROVE_OPTION) {
            return;
        }
        File file = chooser.getSelectedFile();

        status.setText(t("loading", lang));
        status.setForeground(Color.BLACK);
        status.paintImmediately(status.getVisibleRect());

        // ponytail: runs on the UI thread, so the window freezes while importing.
        // Fine for a few thousand rows; move to a SwingWorker if a real file feels slow.
        try {
            Pipeline.Result result = Pipeline.importExcel(file.toPath());
            lastResult = new Object[]{true, result.inserted(), result.updated(), result.skipped()};
        } catch (Exception error) {
            String key = error instanceof IllegalArgumentException ? error.getMessage() : null;
            lastResult = new Object[]{false, key != null ? key : error.toString()};
        }
        renderStatus();
    }

    private void renderStatus() {
        if (lastResult == null) {
            return;
        }
        if ((boolean) lastResult[0]) {
            status.setText("<html><center>%s<br>%s %s<br>%s %s<br>%s %s</center></html>".formatted(
                    t("done", lang),
                    lastResult[1], t("new_products", lang),
                    lastResult[2], t("updated", lang),
                    lastResult[3], t("skipped", lang)));
            status.setForeground(new Color(0x1b7f3b));
        } else {
            status.setText("<html><center>%s<br>%s</center></html>".formatted(
                    t("upload_failed", lang), t((String) lastResult[1], lang)));
            status.setForeground(new Color(0xb00020));
        }
    }

    private void setLang(String newLang) {
        lang = newLang;
        setTitle(t("window_title", lang));
        heading.setText(t("heading", lang));
        subheading.setText(t("subheading", lang));
        chooseButton.setText(t("choose_file", lang));
        enButton.setFont(enButton.getFont().deriveFont(lang.equals("en") ? Font.BOLD : Font.PLAIN));
        iloButton.setFont(iloButton.getFont().deriveFont(lang.equals("ilo") ? Font.BOLD : Font.PLAIN));
        renderStatus();
    }
}
