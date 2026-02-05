import pandas as pd
import os

file_path = r'C:\code\git\Senior_project\AST_Report_Batch_23_ต_ค__2568_14_32_All.xlsx'

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

import json

try:
    df = pd.read_excel(file_path, header=None)
    # Get first 20 rows, fill NaN with None for JSON compatibility
    data = df.head(20).where(pd.notnull(df), None).values.tolist()
    
    with open("template_structure.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
        
    print("Successfully wrote template_structure.json")
except Exception as e:
    print(f"Error reading file: {e}")
