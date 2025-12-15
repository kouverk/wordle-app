"""
Least Likely Entropy Calculator

Finds the WORST guesses - words with the lowest entropy that provide
the least information. Useful for hard mode challenges or curiosity.

This is the inverse of entropy.py - instead of maximizing information,
it finds guesses that tell you almost nothing.
"""

from entropy import (
    compute_entropy,
    fetch_all_valid_words,
    get_top_entropy_words,
)


def get_worst_entropy_words(candidate_list, n=10):
    """
    Get the N words with the LOWEST entropy (worst guesses).

    Returns list of (word, entropy) tuples sorted by entropy ascending.
    """
    word_entropies = {
        word: compute_entropy(candidate_list, word)
        for word in candidate_list
    }
    sorted_words = sorted(word_entropies.items(), key=lambda x: x[1])
    return sorted_words[:n]


def choose_least_likely_word(candidate_list):
    """Choose the word with the lowest entropy (worst next guess)."""
    word_entropies = {
        word: compute_entropy(candidate_list, word)
        for word in candidate_list
    }
    return min(word_entropies, key=word_entropies.get)


if __name__ == "__main__":
    # Fetch all valid words
    all_words = fetch_all_valid_words()
    print(f"Loaded {len(all_words)} valid words")

    # Get worst 10 starting words by entropy
    print("\nTop 10 WORST starting words by entropy:")
    worst_words = get_worst_entropy_words(all_words, 10)
    for word, entropy in worst_words:
        print(f"  {word.upper()}: {entropy:.3f} bits")

    # Compare to best
    print("\nFor comparison, top 10 BEST starting words:")
    best_words = get_top_entropy_words(all_words, 10)
    for word, entropy in best_words:
        print(f"  {word.upper()}: {entropy:.3f} bits")
