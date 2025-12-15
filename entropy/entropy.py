"""
Entropy Calculator for Wordle

This module provides functions to calculate the information-theoretic entropy
of Wordle guesses, helping identify which words will maximally reduce the
remaining candidate pool.

High entropy = more information gained = better guess
"""

import itertools
from collections import Counter
import math
import mysql.connector
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(env_path)


def get_db_connection():
    """Create a database connection using environment variables."""
    return mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'wordleapp')
    )


def compute_entropy(candidate_list, word):
    """
    Compute the entropy of a guess word against a list of possible solutions.

    Entropy measures how much information a guess provides on average.
    Higher entropy = guess splits candidates more evenly = more information.
    """
    pattern_counts = Counter()

    # Simulate feedback for each possible solution
    for solution in candidate_list:
        feedback = generate_feedback(word, solution)
        pattern_counts[feedback] += 1

    # Compute probabilities and entropy
    total_candidates = len(candidate_list)
    probabilities = [count / total_candidates for count in pattern_counts.values()]
    entropy = -sum(p * math.log2(p) for p in probabilities if p > 0)

    return entropy


def generate_feedback(guess, solution):
    """
    Generate Wordle feedback for a guess against a solution.

    Returns tuple of ("Green", "Yellow", "Gray") for each position.
    """
    feedback = []
    solution_chars = list(solution)

    # First pass: mark greens and track remaining letters
    for i, (g, s) in enumerate(zip(guess, solution)):
        if g == s:
            feedback.append("Green")
            solution_chars[i] = None  # Mark as used
        else:
            feedback.append(None)  # Placeholder

    # Second pass: mark yellows and grays
    for i, g in enumerate(guess):
        if feedback[i] is None:  # Not already green
            if g in solution_chars:
                feedback[i] = "Yellow"
                solution_chars[solution_chars.index(g)] = None  # Mark as used
            else:
                feedback[i] = "Gray"

    return tuple(feedback)


def get_top_entropy_words(candidate_list, n=10):
    """
    Compute entropy for all candidates and return top N by entropy.

    Returns list of (word, entropy) tuples sorted by entropy descending.
    """
    word_entropies = {
        word: compute_entropy(candidate_list, word)
        for word in candidate_list
    }
    sorted_words = sorted(word_entropies.items(), key=lambda x: x[1], reverse=True)
    return sorted_words[:n]


def choose_next_guess(candidate_list):
    """Choose the word with the highest entropy (best next guess)."""
    word_entropies = {
        word: compute_entropy(candidate_list, word)
        for word in candidate_list
    }
    return max(word_entropies, key=word_entropies.get)


def fetch_words_from_db(query, params=None):
    """Execute a query and return list of words."""
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(query, params or ())
        words = [row[0] for row in cursor.fetchall()]
    finally:
        cursor.close()
        connection.close()

    return words


def fetch_all_valid_words():
    """Fetch all 5-letter words with frequency >= 20 (same as game uses)."""
    query = "SELECT LOWER(word) FROM words WHERE frequency >= 20"
    return fetch_words_from_db(query)


def filter_candidates(candidates, guess, feedback):
    """
    Filter candidate words based on feedback from a guess.

    Args:
        candidates: List of possible words
        guess: The guessed word
        feedback: Tuple of ("Green", "Yellow", "Gray") for each position

    Returns:
        Filtered list of candidates that match the feedback
    """
    filtered = []

    for candidate in candidates:
        if matches_feedback(candidate, guess, feedback):
            filtered.append(candidate)

    return filtered


def matches_feedback(candidate, guess, feedback):
    """Check if a candidate word would produce the given feedback for a guess."""
    return generate_feedback(guess, candidate) == feedback


# Example usage when run directly
if __name__ == "__main__":
    # Fetch all valid words
    all_words = fetch_all_valid_words()
    print(f"Loaded {len(all_words)} valid words")

    # Get top 10 starting words by entropy
    print("\nTop 10 starting words by entropy:")
    top_words = get_top_entropy_words(all_words, 10)
    for word, entropy in top_words:
        print(f"  {word.upper()}: {entropy:.3f} bits")