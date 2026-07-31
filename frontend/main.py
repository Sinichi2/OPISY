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

BIG = ("Segoe UI", 22, "bold")
PLAIN = ("Segoe UI", 14)


def upload():
    path = filedialog.askopenfilename(
        title="Pumili ng Excel file",
        filetypes=[("Excel file", "*.xlsx *.xlsm")],
    )
    if not path:
        return
    status.config(text="Naglo-load...", fg="black")
    root.update()
    # Fine for a few thousand rows; move to a thread if a real file feels slow.
    try:
        inserted, updated, skipped = import_excel(path)
    except Exception as error:
        status.config(text=f"Hindi na-upload.\n{error}", fg="#b00020")
        return
    status.config(  
        text=f"Tapos na!\n{inserted} bagong proxdukto\n{updated} na-update\n{skipped} nilaktawan",
        fg="#1b7f3b",
    )


root = tk.Tk()
root.title("Pi")
root.geometry("560x400")

tk.Label(root, text="Upload Excel", font=BIG).pack(pady=(40, 10))
tk.Label(root, text="Press the button to upload a file", font=PLAIN).pack()
tk.Button(root, text="PUMILI NG FILE", font=BIG, bg="#1b7f3b", fg="white",
          padx=30, pady=20, command=upload).pack(pady=30)
status = tk.Label(root, text="", font=PLAIN, justify="center")
status.pack()

if __name__ == "__main__":
    root.mainloop()
