#!/usr/bin/env python3
"""
Export words table ordered by score (descending) to CSV.

Usage:
    pip install python-dotenv mysql-connector-python
    python export_words_by_score.py
"""

import os
import csv
import mysql.connector
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(Path(__file__).parent / '.env')

# Database configuration from environment
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'wordleapp')
}

OUTPUT_FILE = Path(__file__).parent / "words_by_score.csv"


def export_words():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, word, frequency, score
        FROM words
        ORDER BY score DESC, word ASC
    """)

    rows = cursor.fetchall()

    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'word', 'frequency', 'score'])
        writer.writerows(rows)

    cursor.close()
    conn.close()

    print(f"Exported {len(rows)} words to {OUTPUT_FILE}")


if __name__ == "__main__":
    export_words()
