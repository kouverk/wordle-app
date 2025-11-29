#!/usr/bin/env python3
"""
Export words table ordered by score (descending) to CSV.

Usage:
    python export_words_by_score.py
"""

import csv
import mysql.connector
from pathlib import Path

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Befef$#$1',
    'database': 'wordleapp'
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
