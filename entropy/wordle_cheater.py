#!/usr/bin/env python3
"""
Wordle Cheater - Terminal Edition

A standalone terminal game that helps you cheat at Wordle using entropy calculations.
Uses SQL-based filtering to narrow down candidates based on feedback.

Usage:
    python wordle_cheater.py
"""

import random
from entropy import (
    fetch_words_from_db,
    generate_feedback,
    get_top_entropy_words,
)

# ANSI color codes for terminal output
GREEN = "\033[92m"
YELLOW = "\033[93m"
GRAY = "\033[90m"
RESET = "\033[0m"
BOLD = "\033[1m"
CYAN = "\033[96m"


def colorize_feedback(guess, feedback):
    """Return a colorized string showing the guess with feedback colors."""
    result = ""
    for letter, fb in zip(guess.upper(), feedback):
        if fb == "Green":
            result += f"{GREEN}{BOLD}{letter}{RESET}"
        elif fb == "Yellow":
            result += f"{YELLOW}{BOLD}{letter}{RESET}"
        else:
            result += f"{GRAY}{letter}{RESET}"
    return result


def print_header():
    """Print the game header."""
    print(f"\n{CYAN}{'=' * 50}{RESET}")
    print(f"{CYAN}{BOLD}  WORDLE CHEATER - Terminal Edition{RESET}")
    print(f"{CYAN}{'=' * 50}{RESET}\n")


def build_sql_from_feedback(guess, feedback, existing_conditions=None):
    """
    Build SQL WHERE conditions from a guess and its feedback.
    """
    conditions = existing_conditions.copy() if existing_conditions else []

    gray_letters = set()
    green_yellow_letters = set()

    # First pass: identify green and yellow letters
    for i, (letter, fb) in enumerate(zip(guess, feedback)):
        if fb in ("Green", "Yellow"):
            green_yellow_letters.add(letter)

    # Second pass: build conditions
    for i, (letter, fb) in enumerate(zip(guess, feedback)):
        pos = i + 1  # SQL SUBSTRING is 1-indexed

        if fb == "Green":
            conditions.append(f"SUBSTRING(LOWER(word), {pos}, 1) = '{letter}'")

        elif fb == "Yellow":
            conditions.append(f"LOWER(word) LIKE '%{letter}%'")
            conditions.append(f"SUBSTRING(LOWER(word), {pos}, 1) != '{letter}'")

        elif fb == "Gray":
            if letter not in green_yellow_letters:
                gray_letters.add(letter)

    for letter in gray_letters:
        conditions.append(f"LOWER(word) NOT LIKE '%{letter}%'")

    return conditions


def fetch_candidates_with_sql(conditions):
    """Fetch candidate words from DB using SQL conditions."""
    base_query = "SELECT LOWER(word) FROM words"

    if conditions:
        where_clause = " AND ".join(conditions)
        query = f"{base_query} WHERE {where_clause}"
    else:
        query = base_query

    return fetch_words_from_db(query)


def fetch_random_solution():
    """Fetch a single random word to be the solution."""
    query = "SELECT LOWER(word) FROM words WHERE frequency >= 20 ORDER BY RAND() LIMIT 1"
    words = fetch_words_from_db(query)
    return words[0] if words else None


def check_word_exists(word):
    """Check if a word exists in the database (any frequency - valid guess)."""
    query = f"SELECT COUNT(*) as cnt FROM words WHERE LOWER(word) = '{word}'"
    from entropy import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query)
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result[0] > 0


def print_suggestions(candidates, attempt_num):
    """Print top entropy suggestions."""
    print(f"\n{CYAN}--- Attempt {attempt_num}/6 | {len(candidates)} candidates remaining ---{RESET}")

    if len(candidates) <= 20:
        print(f"\nRemaining words: {', '.join(w.upper() for w in candidates)}")

    if len(candidates) == 1:
        print(f"\n{GREEN}{BOLD}Only one word left: {candidates[0].upper()}{RESET}")
        return

    if len(candidates) == 0:
        print(f"\n{YELLOW}No candidates remaining!{RESET}")
        return

    print(f"\n{BOLD}Top 10 guesses by entropy:{RESET}")
    print(f"  {GRAY}(calculating...){RESET}", end="\r")
    top_words = get_top_entropy_words(candidates, min(10, len(candidates)))
    print(f"                      ", end="\r")  # Clear
    for i, (word, entropy) in enumerate(top_words, 1):
        print(f"  {i:2}. {word.upper()}  ({entropy:.3f} bits)")


def get_user_guess(solution=None):
    """Get a valid guess from the user."""
    while True:
        guess = input(f"\n{BOLD}Enter your guess ('q' quit, '!reveal' to cheat): {RESET}").strip().lower()

        if guess == 'q':
            return None

        if guess == '!reveal' and solution:
            print(f"\n  {YELLOW}The answer is: {solution.upper()}{RESET}")
            continue

        if len(guess) != 5:
            print("  Please enter a 5-letter word.")
            continue

        if not check_word_exists(guess):
            print("  Word not in dictionary. Try again.")
            continue

        return guess


def play_game():
    """Main game loop. Returns True if game completed, False if quit early."""
    print_header()

    # Pick a random solution (single query, no loading full list)
    solution = fetch_random_solution()
    if not solution:
        print("Error: Could not fetch a word from database.")
        return False

    sql_conditions = []
    attempts = []

    print(f"{BOLD}A random word has been selected. Let's cheat!{RESET}")
    print(f"(Type '!reveal' to see the answer)")

    for attempt_num in range(1, 7):
        # Get user's guess FIRST (before showing suggestions)
        guess = get_user_guess(solution)
        if guess is None:
            print(f"\n{YELLOW}Quitting... The word was: {solution.upper()}{RESET}")
            return False

        # Generate feedback by comparing guess to solution
        feedback = generate_feedback(guess, solution)
        colored = colorize_feedback(guess, feedback)
        attempts.append((guess, feedback, colored))

        print(f"\n  Result: {colored}")

        # Check for win
        if guess == solution:
            print(f"\n{GREEN}{BOLD}{'=' * 50}{RESET}")
            print(f"{GREEN}{BOLD}  YOU WON IN {attempt_num} ATTEMPT{'S' if attempt_num > 1 else ''}!{RESET}")
            print(f"{GREEN}{BOLD}{'=' * 50}{RESET}")
            break

        # Build SQL conditions from this feedback
        sql_conditions = build_sql_from_feedback(guess, feedback, sql_conditions)

        # NOW fetch and show suggestions for next guess
        candidates = fetch_candidates_with_sql(sql_conditions)
        print_suggestions(candidates, attempt_num + 1)

    else:
        # Used all 6 attempts without winning
        print(f"\n{YELLOW}{'=' * 50}{RESET}")
        print(f"{YELLOW}  GAME OVER - The word was: {solution.upper()}{RESET}")
        print(f"{YELLOW}{'=' * 50}{RESET}")

    # Show attempt history
    print(f"\n{BOLD}Your attempts:{RESET}")
    for i, (guess, feedback, colored) in enumerate(attempts, 1):
        print(f"  {i}. {colored}")

    return True


def main():
    """Entry point."""
    completed = play_game()

    if completed:
        print()
        again = input("Play again? (y/n): ").strip().lower()
        if again == 'y':
            main()


if __name__ == "__main__":
    main()
