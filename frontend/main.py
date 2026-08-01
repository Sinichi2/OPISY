"""
    Uploader screen: one button, staff picks their Excel file, system says what
    happened in plain words. Pictures and the rest of the inventory UI come later.
"""
import sys
import tkinter as tk
from pathlib import Path
from tkinter import filedialog

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend.data.ETL.pipeline import import_excel
from backend.i18n import t

BIG = ("Segoe UI", 22, "bold")
PLAIN = ("Segoe UI", 14)

lang = "en"
last_result = None  # (ok: bool, inserted, updated, skipped) or (False, error_key) -- redrawn on language switch
window_title="Pi"

def upload():
    global last_result
    path = filedialog.askopenfilename(
        title=t("file_picker_title", lang),
        filetypes=[("Excel file", "*.xlsx *.xlsm")],
    )
    if not path:
        return
    status.config(text=t("loading", lang), fg="black")
    root.update()
    # ponytail: runs on the UI thread, so the window freezes while importing.
    # Fine for a few thousand rows; move to a thread if a real file feels slow.
    try:
        inserted, updated, skipped = import_excel(path)
    except Exception as error:
        last_result = (False, str(error))
        render_status()
        return
    last_result = (True, inserted, updated, skipped)
    render_status()


def render_status():
    if last_result is None:
        return
    if last_result[0]:
        _, inserted, updated, skipped = last_result
        status.config(
            text=f"{t('done', lang)}\n{inserted} {t('new_products', lang)}"
                 f"\n{updated} {t('updated', lang)}\n{skipped} {t('skipped', lang)}",
            fg="#1b7f3b",
        )
    else:
        status.config(text=f"{t('upload_failed', lang)}\n{t(last_result[1], lang)}", fg="#b00020")


def set_lang(new_lang):
    global lang
    lang = new_lang
    root.title(t("Pi", lang))
    heading.config(text=t("heading", lang))
    subheading.config(text=t("subheading", lang))
    choose_button.config(text=t("choose_file", lang))
    en_button.config(relief="sunken" if lang == "en" else "raised")
    ilo_button.config(relief="sunken" if lang == "ilo" else "raised")
    render_status()


root = tk.Tk()
root.geometry("560x420")

lang_bar = tk.Frame(root)
lang_bar.pack(anchor="ne", padx=10, pady=10)
en_button = tk.Button(lang_bar, text="EN", width=4, command=lambda: set_lang("en"))
ilo_button = tk.Button(lang_bar, text="ILO", width=4, command=lambda: set_lang("ilo"))
en_button.pack(side="left")
ilo_button.pack(side="left")

heading = tk.Label(root, font=BIG)
heading.pack(pady=(20, 10))
subheading = tk.Label(root, font=PLAIN)
subheading.pack()
choose_button = tk.Button(root, font=BIG, bg="#1b7f3b", fg="white",
                           padx=30, pady=20, command=upload)
choose_button.pack(pady=30)
status = tk.Label(root, text="", font=PLAIN, justify="center")
status.pack()

set_lang(lang)

if __name__ == "__main__":
    root.mainloop()
