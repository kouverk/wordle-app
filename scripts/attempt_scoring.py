#!/usr/bin/env python3
"""
Attempt-Based Scoring Multiplier for Wordle

This module provides a scoring multiplier based on the number of attempts
a player takes to guess the word.

The curve follows a sigmoid/logistic shape (similar to -tan(x)):
- Steep at extremes (1-2 and 5-6 attempts)
- Gentle inflection zone around 3-4 attempts
- 1-2 attempts give ABOVE 100% (bonus)
- 5-6 attempts give diminishing returns (penalty)

Final score = word_base_score * attempt_multiplier
"""

import math


def get_attempt_multiplier(attempts: int) -> float:
    """
    Calculate the scoring multiplier based on number of attempts.

    Uses a cubic polynomial to create a curve with:
    - Steep descent at extremes (1-2 and 5-6)
    - Gentle inflection zone around 3-4 (near 100%)
    - 1-2 attempts: Above 100% (bonus)
    - 5-6 attempts: Below 100% (penalty)

    The shape is similar to -tan(x) or an S-curve with flat middle.

    Args:
        attempts: Number of guesses taken (1-6)

    Returns:
        Multiplier as a decimal (e.g., 1.4 = 140%, 0.55 = 55%)
    """
    if attempts < 1:
        attempts = 1
    if attempts > 6:
        attempts = 6

    # Use a lookup table with carefully tuned values
    # that create the desired curve shape:
    # - Steep drop 1->2 (about 15 points)
    # - Gentle drop 2->3 (about 8 points)
    # - Very gentle 3->4 (about 8 points, crossing 100%)
    # - Gentle drop 4->5 (about 10 points)
    # - Steep drop 5->6 (about 15 points)

    # Symmetric curve with flat inflection zone at 3-4
    # Drops: 30 -> 18 -> 4 -> 18 -> 30 (mirrors around center)
    multipliers = {
        1: 1.50,   # 150% - exceptional bonus
        2: 1.20,   # 120% - strong bonus      (-30)
        3: 1.02,   # 102% - slight bonus      (-18)
        4: 0.98,   # 98%  - slight penalty    (-4)  <-- inflection
        5: 0.80,   # 80%  - moderate penalty  (-18)
        6: 0.50,   # 50%  - heavy penalty     (-30)
    }

    return multipliers[attempts]


def get_attempt_multiplier_table() -> dict:
    """
    Get a lookup table of all attempt multipliers.

    Returns:
        Dict mapping attempts (1-6) to multipliers
    """
    return {i: get_attempt_multiplier(i) for i in range(1, 7)}


def calculate_final_score(word_base_score: float, attempts: int) -> int:
    """
    Calculate the final score for a completed word.

    Args:
        word_base_score: The base score from word frequency (1.0 - 10.0)
        attempts: Number of guesses taken (1-6)

    Returns:
        Final score as integer (ceiling of word_base_score * attempt_multiplier)
    """
    multiplier = get_attempt_multiplier(attempts)
    raw_score = word_base_score * multiplier
    return math.ceil(raw_score)


def print_multiplier_table():
    """Print a formatted table of attempt multipliers."""
    print("\n" + "=" * 50)
    print("ATTEMPT MULTIPLIER TABLE")
    print("=" * 50)
    print(f"{'Attempts':<10} {'Multiplier':<12} {'As %':<10} {'Example (base=5.0)':<15}")
    print("-" * 50)

    for attempts in range(1, 7):
        mult = get_attempt_multiplier(attempts)
        pct = f"{mult * 100:.0f}%"
        example = calculate_final_score(5.0, attempts)
        print(f"{attempts:<10} {mult:<12.2f} {pct:<10} {example:<15}")

    print("-" * 50)


def print_curve_visualization():
    """Print an ASCII visualization of the curve."""
    print("\n" + "=" * 50)
    print("CURVE VISUALIZATION")
    print("=" * 50)
    print("150% |", end="")

    # Create ASCII chart
    rows = []
    for pct in range(150, 40, -10):
        row = f"{pct:>3}% |"
        for attempts in range(1, 7):
            mult = get_attempt_multiplier(attempts) * 100
            if abs(mult - pct) < 5:
                row += "  *  "
            elif mult > pct:
                row += "  |  "
            else:
                row += "     "
        rows.append(row)

    for row in rows:
        print(row)

    print("     +" + "-" * 30)
    print("       1    2    3    4    5    6")
    print("              Attempts")
    print()
    print("Key characteristics:")
    print("  - Steep descent at 1-2 (big bonus for quick solves)")
    print("  - Gentle slope at 3-4 (inflection zone)")
    print("  - Steep descent at 5-6 (heavy penalty for slow solves)")


if __name__ == "__main__":
    print("=" * 50)
    print("ATTEMPT-BASED SCORING FOR WORDLE")
    print("=" * 50)

    print_multiplier_table()
    print_curve_visualization()

    print("\n" + "=" * 50)
    print("EXAMPLE CALCULATIONS")
    print("=" * 50)

    # Examples with different word difficulties
    examples = [
        ("WHICH", 2.3, "Very common word"),
        ("ABOUT", 1.5, "Extremely common"),
        ("CRANE", 5.2, "Moderate word"),
        ("QUERY", 7.8, "Uncommon word"),
        ("ZESTY", 9.5, "Rare word"),
    ]

    print(f"\n{'Word':<8} {'Base':<6} {'Attempts':<10} {'Multiplier':<12} {'Raw':<10} {'Final':<8}")
    print("-" * 60)

    for word, base, desc in examples:
        for attempts in [1, 3, 6]:
            mult = get_attempt_multiplier(attempts)
            raw = base * mult
            final = calculate_final_score(base, attempts)
            if attempts == 1:
                print(f"{word:<8} {base:<6.1f} {attempts:<10} {mult:<12.2f} {raw:<10.2f} {final:<8}")
            else:
                print(f"{'':8} {'':6} {attempts:<10} {mult:<12.2f} {raw:<10.2f} {final:<8}")
        print()
