/**
 * Scoring utility for Wordle game
 *
 * Score = ceil(word_base_score * attempt_multiplier)
 *
 * - word_base_score: 1.0 (common) to 10.0 (rare) from database
 * - attempt_multiplier: symmetric S-curve favoring fewer guesses
 */

// Attempt multipliers - symmetric curve with flat inflection at 3-4
// Drops: 30 -> 18 -> 4 -> 18 -> 30 (mirrors around center)
const ATTEMPT_MULTIPLIERS = {
  1: 1.50,   // 150% - exceptional bonus
  2: 1.20,   // 120% - strong bonus      (-30)
  3: 1.02,   // 102% - slight bonus      (-18)
  4: 0.98,   // 98%  - slight penalty    (-4)  <-- inflection
  5: 0.80,   // 80%  - moderate penalty  (-18)
  6: 0.50,   // 50%  - heavy penalty     (-30)
};

/**
 * Get the attempt multiplier for a given number of attempts
 * @param {number} attempts - Number of guesses taken (1-6)
 * @returns {number} Multiplier (e.g., 1.5 = 150%)
 */
function getAttemptMultiplier(attempts) {
  if (attempts < 1) attempts = 1;
  if (attempts > 6) attempts = 6;
  return ATTEMPT_MULTIPLIERS[attempts];
}

/**
 * Calculate final score for a completed word
 * @param {number} wordBaseScore - Base score from word frequency (1.0 - 10.0)
 * @param {number} attempts - Number of guesses taken (1-6)
 * @returns {number} Final score as integer (ceiling)
 */
function calculateFinalScore(wordBaseScore, attempts) {
  const multiplier = getAttemptMultiplier(attempts);
  const rawScore = wordBaseScore * multiplier;
  return Math.ceil(rawScore);
}

module.exports = {
  getAttemptMultiplier,
  calculateFinalScore,
  ATTEMPT_MULTIPLIERS
};
