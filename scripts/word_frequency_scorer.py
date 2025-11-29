#!/usr/bin/env python3
"""
Word Frequency Scorer for Wordle App

This script:
1. Downloads word frequency data from Kaggle (English Word Frequency dataset)
2. Matches frequencies to the words in the MySQL words table
3. Calculates a score based on Zipf's law / Pareto distribution
4. Updates the words table with frequency and score columns

Scoring logic:
- Common words (top 20%) get low scores (1-2 points)
- Uncommon words get progressively higher scores
- Uses logarithmic scaling to prevent infinite scores for rare words
- Max score capped at 10

Usage:
    pip install python-dotenv mysql-connector-python requests
    python word_frequency_scorer.py
"""

import os
import sys
import csv
import math
import zipfile
import requests
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

# Kaggle dataset info
# Note: For full automation, you'd need Kaggle API credentials
# For now, we'll use a direct frequency list from a public source
FREQUENCY_DATA_URL = "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_full.txt"
FREQUENCY_FILE = Path(__file__).parent / "word_frequencies.txt"


def download_frequency_data():
    """Download word frequency data if not already present."""
    if FREQUENCY_FILE.exists():
        print(f"Frequency data already exists at {FREQUENCY_FILE}")
        return True

    print(f"Downloading word frequency data from {FREQUENCY_DATA_URL}...")
    try:
        response = requests.get(FREQUENCY_DATA_URL, timeout=60)
        response.raise_for_status()

        with open(FREQUENCY_FILE, 'w', encoding='utf-8') as f:
            f.write(response.text)

        print(f"Downloaded frequency data to {FREQUENCY_FILE}")
        return True
    except Exception as e:
        print(f"Error downloading frequency data: {e}")
        return False


def load_frequency_data():
    """Load word frequencies from the downloaded file."""
    frequencies = {}

    print("Loading frequency data...")
    with open(FREQUENCY_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 2:
                word = parts[0].upper()  # Our words are uppercase
                try:
                    freq = int(parts[1])
                    # Only keep 5-letter words
                    if len(word) == 5 and word.isalpha():
                        frequencies[word] = freq
                except ValueError:
                    continue

    print(f"Loaded {len(frequencies)} 5-letter word frequencies")
    return frequencies


def calculate_score(frequency, max_freq, min_freq):
    """
    Calculate score based on word frequency using log scaling.

    - High frequency (common) words get LOW scores (easier to guess)
    - Low frequency (rare) words get HIGH scores (harder to guess)
    - Uses logarithmic scaling to handle the Zipf distribution
    - Scores range from 1 to 10
    """
    if frequency <= 0:
        return 10  # Unknown words get max score

    # Log scale the frequency
    log_freq = math.log10(frequency + 1)
    log_max = math.log10(max_freq + 1)
    log_min = math.log10(min_freq + 1)

    # Normalize to 0-1 range (inverted: high freq = low score)
    if log_max == log_min:
        normalized = 0.5
    else:
        normalized = 1 - (log_freq - log_min) / (log_max - log_min)

    # Scale to 1-10 range
    score = 1 + (normalized * 9)

    # Round to 1 decimal place
    return round(score, 1)


def get_words_from_db():
    """Fetch all words from the database."""
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute("SELECT id, word FROM words")
    words = cursor.fetchall()

    cursor.close()
    conn.close()

    print(f"Fetched {len(words)} words from database")
    return words


def add_frequency_columns():
    """Add frequency and score columns to the words table if they don't exist."""
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # Check if columns exist
    cursor.execute("SHOW COLUMNS FROM words LIKE 'frequency'")
    if not cursor.fetchone():
        print("Adding 'frequency' column to words table...")
        cursor.execute("ALTER TABLE words ADD COLUMN frequency BIGINT DEFAULT 0")

    cursor.execute("SHOW COLUMNS FROM words LIKE 'score'")
    if not cursor.fetchone():
        print("Adding 'score' column to words table...")
        cursor.execute("ALTER TABLE words ADD COLUMN score DECIMAL(3,1) DEFAULT 5.0")

    conn.commit()
    cursor.close()
    conn.close()
    print("Columns ready")


def update_word_frequencies(words, frequencies):
    """Update the database with frequency and score data."""
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # Find min/max frequencies for scoring
    matched_freqs = [frequencies.get(word, 0) for _, word in words if frequencies.get(word, 0) > 0]

    if not matched_freqs:
        print("No frequency matches found!")
        return

    max_freq = max(matched_freqs)
    min_freq = min(matched_freqs)

    print(f"Frequency range: {min_freq:,} to {max_freq:,}")

    # Update each word
    matched_count = 0
    unmatched_count = 0

    update_query = "UPDATE words SET frequency = %s, score = %s WHERE id = %s"

    for word_id, word in words:
        freq = frequencies.get(word, 0)

        if freq > 0:
            matched_count += 1
        else:
            unmatched_count += 1

        score = calculate_score(freq, max_freq, min_freq)
        cursor.execute(update_query, (freq, score, word_id))

    conn.commit()
    cursor.close()
    conn.close()

    print(f"Updated {matched_count} words with frequency data")
    print(f"{unmatched_count} words had no frequency match (assigned score 10)")


def show_sample_results():
    """Display sample results to verify the scoring."""
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    print("\n" + "="*60)
    print("SAMPLE RESULTS")
    print("="*60)

    # Most common words (lowest scores)
    print("\nMost COMMON words (lowest scores - easiest):")
    cursor.execute("SELECT word, frequency, score FROM words WHERE frequency > 0 ORDER BY frequency DESC LIMIT 10")
    for word, freq, score in cursor.fetchall():
        print(f"  {word}: frequency={freq:>12,}  score={score}")

    # Least common words with frequency data (highest scores)
    print("\nLeast COMMON words with data (highest scores - hardest):")
    cursor.execute("SELECT word, frequency, score FROM words WHERE frequency > 0 ORDER BY frequency ASC LIMIT 10")
    for word, freq, score in cursor.fetchall():
        print(f"  {word}: frequency={freq:>12,}  score={score}")

    # Words with no frequency data
    print("\nWords with NO frequency data (max score):")
    cursor.execute("SELECT word, frequency, score FROM words WHERE frequency = 0 LIMIT 10")
    for word, freq, score in cursor.fetchall():
        print(f"  {word}: frequency={freq:>12,}  score={score}")

    # Score distribution
    print("\nScore distribution:")
    cursor.execute("""
        SELECT
            CASE
                WHEN score <= 2 THEN '1-2 (very common)'
                WHEN score <= 4 THEN '2-4 (common)'
                WHEN score <= 6 THEN '4-6 (moderate)'
                WHEN score <= 8 THEN '6-8 (uncommon)'
                ELSE '8-10 (rare)'
            END as score_range,
            COUNT(*) as count
        FROM words
        GROUP BY score_range
        ORDER BY MIN(score)
    """)
    for score_range, count in cursor.fetchall():
        print(f"  {score_range}: {count} words")

    cursor.close()
    conn.close()


def main():
    print("="*60)
    print("WORD FREQUENCY SCORER FOR WORDLE")
    print("="*60 + "\n")

    # Step 1: Download frequency data
    if not download_frequency_data():
        sys.exit(1)

    # Step 2: Load frequency data
    frequencies = load_frequency_data()

    # Step 3: Add columns to database
    add_frequency_columns()

    # Step 4: Get words from database
    words = get_words_from_db()

    # Step 5: Update words with frequencies and scores
    update_word_frequencies(words, frequencies)

    # Step 6: Show sample results
    show_sample_results()

    print("\n" + "="*60)
    print("DONE! Word frequencies and scores have been added to the database.")
    print("="*60)


if __name__ == "__main__":
    main()
