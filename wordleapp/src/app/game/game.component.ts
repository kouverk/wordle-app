import { Component, OnInit, OnDestroy, Renderer2, ElementRef, ChangeDetectorRef } from '@angular/core';
import { MaterialModule } from '../modules/material.module';
import { SharedModule } from '../modules/shared.module';
import { GameService } from '../services/game.service';
import { Game, Attempts } from '../services/interfaces'; // Ensure Attempts is imported
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [SharedModule, MaterialModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'] // Fix typo from styleUrl to styleUrls
})
export class GameComponent implements OnInit, OnDestroy {
  game: Game | null = null;
  attempts: Attempts | null = null; // Store attempts data
  multiplayer: boolean = false;
  board: string[][] = Array(6).fill(null).map(() => Array(5).fill('')); // 6 rows, 5 columns
  currentRow: number = 0; // To track the current row
  currentCol: number = 0;
  firstRow: string[] = 'QWERTYUIOP'.split('');
  secondRow: string[] = 'ASDFGHJKL'.split('');
  thirdRow: string[] = 'ZXCVBNM'.split('');
  solution: string = '';
  currentWord: string = '';
  animationInProgress: boolean = false;
  newFlipDelay = 400;
  newColorDelay = this.newFlipDelay/2;
  nextRowDelay = this.newFlipDelay + this.newColorDelay;
  waveDuration = 300;
  wiggleDuration = 650;
  messageIsVisible: boolean = false;
  message: string = '';
  isInitialLoad: boolean = true;
  lastSubmittedRow: number = -1; // Track last row we submitted to prevent duplicates
  turnCompletionInProgress: boolean = false; // Prevent multiple completeTurn calls
  private gameSubscription: Subscription | null = null;
  private attemptsSubscription: Subscription | null = null;
  private keyboardListener: (() => void) | null = null;

  constructor(private gameservice: GameService, private renderer: Renderer2, private el: ElementRef, private cdr: ChangeDetectorRef){}

  ngOnInit() {
    // Subscribe to game updates
    this.gameSubscription = this.gameservice.game$.subscribe(game => {
      const previousGameId = this.game?.game_id;
      this.game = game; // Update the component's game variable

      if (this.game == null) {
        // No game loaded - only fetch a random solution if user is NOT logged in
        // (logged in users will get a new game via retrieveSinglePlayerGame)
        const userId = localStorage.getItem('user_id');
        if (!userId) {
          this.fetchSolution();
        }
        this.multiplayer = false;
      } else {
        // Game loaded from server
        this.multiplayer = this.game.game_type === 'multiplayer';
        this.solution = this.game.word;
        console.log('SOLUTION:', this.solution);

        // If this is a different game than before, reset the board
        if (previousGameId !== this.game.game_id) {
          this.resetBoard();
        }
      }
    });

    // Subscribe to attempts updates
    this.attemptsSubscription = this.gameservice.attempts$.subscribe(attempts => {
      const hadAttempts = this.attempts && this.attempts.length > 0;
      this.attempts = attempts; // Update attempts variable
      this.cdr.detectChanges();  // Manually trigger change detection

      // Update board if this is initial load OR if attempts were cleared (new game)
      if (this.isInitialLoad || (!attempts && hadAttempts)) {
        this.updateBoardWithAttempts(); // Update board display with attempts
        this.isInitialLoad = false;
      }
    });

    // Listen for keyboard events using Renderer2
    this.keyboardListener = this.renderer.listen('window', 'keydown', (event: KeyboardEvent) => {
      this.handleKeyPress(event);
    });
  }

  ngOnDestroy() {
    if (this.gameSubscription) {
      this.gameSubscription.unsubscribe();
    }
    if (this.attemptsSubscription) {
      this.attemptsSubscription.unsubscribe();
    }
    if (this.keyboardListener) {
      this.keyboardListener();
    }
  }

  // Fetch the solution from the server
  fetchSolution(): void {
    this.gameservice.getSolution().subscribe({
      next: (data) => {
        this.solution = data.word;
        console.log('SOLUTION:', this.solution);
      },
      error: (error) => {
        console.error('Error fetching solution word:', error);
      },
    });
  }

  // Reset the board for a new game
  resetBoard(): void {
    // Clear the board array
    this.board = Array(6).fill(null).map(() => Array(5).fill(''));
    this.currentRow = 0;
    this.currentCol = 0;
    this.currentWord = '';
    this.lastSubmittedRow = -1;
    this.isInitialLoad = true;
    this.animationInProgress = false;
    // Note: Don't reset turnCompletionInProgress here - it guards against multiple calls during turn transition

    // Clear the DOM - remove classes from all cells and keyboard keys
    const cells = this.el.nativeElement.querySelectorAll('.cell');
    cells.forEach((cell: HTMLElement) => {
      cell.textContent = '';
      this.renderer.removeClass(cell, 'correct');
      this.renderer.removeClass(cell, 'present');
      this.renderer.removeClass(cell, 'absent');
      this.renderer.removeClass(cell, 'flip');
      this.renderer.removeClass(cell, 'wave');
    });

    const keys = this.el.nativeElement.querySelectorAll('.key');
    keys.forEach((key: HTMLElement) => {
      this.renderer.removeClass(key, 'correct');
      this.renderer.removeClass(key, 'present');
      this.renderer.removeClass(key, 'absent');
    });
  }

  // Update board based on attempts data
  updateBoardWithAttempts(): void {
    console.log('update board with attempts');

    // For multiplayer: if there's no word set, we're in "choose word" state
    // Don't process any attempts - they're from previous turns
    if (this.game?.game_type === 'multiplayer' && !this.game.word) {
      console.log('Multiplayer game with no word set - skipping attempt processing');
      return;
    }

    if (this.attempts && this.attempts.length) {
        // Safeguard: Check if this is a completed game (6 attempts or last attempt was correct)
        const lastAttempt = this.attempts[this.attempts.length - 1];
        const isGameComplete = this.attempts.length >= 6 || lastAttempt?.is_correct;

        if (isGameComplete && !this.turnCompletionInProgress) {
            console.log('Detected completed game on load, triggering completion handler');
            const won = lastAttempt?.is_correct || false;
            if (this.game?.game_type === 'singleplayer') {
                this.handleSinglePlayerGameComplete(won);
            } else if (this.game?.game_type === 'multiplayer') {
                this.handleMultiplayerTurnComplete(this.attempts.length, won);
            }
            return; // Don't load stale data into board
        }

        // Loop through each attempt and update the board
        this.attempts.forEach((attempt, attemptIndex) => {
            const attemptRow = attemptIndex;  // Use index to determine row directly
            const attemptLetters = attempt.attempt.split('');
            const solutionLetters = this.solution.split('');

            attemptLetters.forEach((letter, letterIndex) => {
                const cellElement = this.el.nativeElement.querySelector(
                    `.row:nth-of-type(${attemptRow + 1}) .cell:nth-of-type(${letterIndex + 1})`
                );

                // Only update cell if it exists (ensures row and column are valid)
                if (cellElement) {
                    cellElement.textContent = letter;
                    // Assign classes based on letter correctness
                    const isCorrectPosition = letter === solutionLetters[letterIndex];
                    if (isCorrectPosition) {
                        this.renderer.addClass(cellElement, 'correct'); // Green for correct position
                        this.updateKeyboard(letter, 'correct');
                    } else if (solutionLetters.includes(letter)) {
                        this.renderer.addClass(cellElement, 'present'); // Yellow for present but wrong position
                        this.updateKeyboard(letter, 'present');
                    } else {
                        this.renderer.addClass(cellElement, 'absent'); // Grey for absent letter
                        this.updateKeyboard(letter, 'absent');
                    }
                }
            });
        });

        // Set currentRow to the next empty row after all attempts are displayed
        this.currentRow = this.attempts.length;
        this.currentCol = 0;  // Reset current column to the beginning for new input
        // Set lastSubmittedRow to the last row that was already submitted
        this.lastSubmittedRow = this.attempts.length - 1;
    }
}


  // Handle key press events
  handleKeyPress(event: KeyboardEvent): void {
    const key = event.key.toUpperCase();

    // Check if the key pressed is a letter
    if (this.isLetter(key)) {
      this.handleLetterInput(key);
    } else if (key === 'ENTER') {
      event.preventDefault();
      event.stopPropagation();
      this.handleEnter();
    } else if (key === 'BACKSPACE' || key === 'DELETE') {
      this.handleDelete();
    }
  }

  isLetter(key: string): boolean {
    return /^[A-Z]$/.test(key); // Check if the key is a letter A-Z
  }

  handleLetterInput(letter: string): void {
    // If the current row is full, do not add new letters
    if (this.currentCol < 5 && this.currentRow < 6) {
      this.board[this.currentRow][this.currentCol] = letter;
      this.currentCol++;
      this.currentWord = this.board[this.currentRow].join('');  // Update current word with row letters
    }
  }

  handleDelete(): void {
    if (this.currentCol > 0) {
      this.currentCol--;
      this.board[this.currentRow][this.currentCol] = ''; // Clear the last letter
      this.currentWord = this.board[this.currentRow].join('');  // Update current word
    }
  }

  // Add methods for button clicks for the virtual keyboard
  onLetterClick(letter: string): void {
    this.handleLetterInput(letter);
  }

  onEnterClick(): void {
    this.handleEnter();
  }

  onDeleteClick(): void {
    this.handleDelete();
  }

  handleEnter(): void {
    // Prevent submission while animation is in progress
    if (this.animationInProgress) {
      return;
    }
    // Prevent duplicate submission for the same row
    if (this.currentRow === this.lastSubmittedRow) {
      return;
    }
    if (this.currentCol === 5) {
      this.animationInProgress = true; // Lock immediately to prevent double submission
      this.lastSubmittedRow = this.currentRow; // Mark this row as submitted
      this.gameservice.checkWord(this.currentWord).subscribe({
        next: (data) => {
          if (data.exists) {
            this.gameservice.addAttemptsData(this.currentWord, this.currentWord === this.solution, this.currentRow);
            this.animateWord(this.board[this.currentRow], this.currentRow); // Pass currentRow
          } else {
            this.animationInProgress = false; // Unlock since word was invalid
            this.lastSubmittedRow = -1; // Reset so they can try again on this row
            this.wiggleRow(this.currentRow);
            this.showMessage('Not a word diva 😭', 1500);
          }
        },
        error: (error) => {
          this.animationInProgress = false; // Unlock on error
          this.lastSubmittedRow = -1; // Reset so they can try again
          console.error('Error checking word:', error);
        }
      });
    }
  }

  animateWord(attemptedWord: string[], row: number): void {  // Accept row as parameter
    this.animationInProgress = true;

    attemptedWord.forEach((letter, index) => {
      setTimeout(() => {
        this.flipLetter(index, letter, row); // Pass row to flipLetter
      }, index * this.newFlipDelay);
    });

    setTimeout(() => {
      this.currentRow++;
      this.currentCol = 0;
      this.currentWord = attemptedWord.join('');
      this.animationInProgress = false;

      const isWin = this.currentWord === this.solution;
      const isGameOver = this.currentRow >= 6;

      if (isWin) {
        const currentRowElement = this.el.nativeElement.querySelector(`.row:nth-child(${row + 1})`);
        this.triggerWaveAnimation(currentRowElement);
        setTimeout(() => {
          this.showMessage('Great Job Pwincess 🤩', 4000);
          // Complete turn for multiplayer after showing message
          console.log('Win detected. Game type:', this.game?.game_type, 'multiplayer flag:', this.multiplayer);
          if (this.game?.game_type === 'multiplayer') {
            this.handleMultiplayerTurnComplete(row + 1, true); // attempts_used = row + 1, won = true
          } else if (this.game?.game_type === 'singleplayer') {
            this.handleSinglePlayerGameComplete(true);
          }
        }, this.waveDuration);
      } else if (isGameOver) {
        // Used all 6 attempts without winning
        this.showMessage(`The word was ${this.solution} 😔`, 4000);
        console.log('Game over. Game type:', this.game?.game_type, 'multiplayer flag:', this.multiplayer);
        if (this.game?.game_type === 'multiplayer') {
          this.handleMultiplayerTurnComplete(6, false); // 6 attempts, won = false
        } else if (this.game?.game_type === 'singleplayer') {
          this.handleSinglePlayerGameComplete(false);
        }
      }
    }, attemptedWord.length * this.nextRowDelay);
  }

  // Handle completing a multiplayer turn
  private handleMultiplayerTurnComplete(attemptsUsed: number, won: boolean = false): void {
    // Guard against multiple calls
    if (this.turnCompletionInProgress) {
      console.log('Turn completion already in progress, skipping');
      return;
    }

    console.log('handleMultiplayerTurnComplete called with attempts:', attemptsUsed, 'won:', won);

    if (this.game && this.game.game_type === 'multiplayer') {
      this.turnCompletionInProgress = true;
      const multiplayerGame = this.game;
      console.log('Calling completeTurn in 2 seconds for game_id:', multiplayerGame.game_id);
      // Delay before switching turns to let the user see the result
      setTimeout(() => {
        console.log('Executing completeTurn now');
        this.gameservice.completeTurn(multiplayerGame.game_id, multiplayerGame.player_turn, attemptsUsed, won);
      }, 2000);
    }
  }

  // Handle completing a single player game
  private handleSinglePlayerGameComplete(won: boolean): void {
    if (this.game && this.game.game_type === 'singleplayer') {
      this.gameservice.completeSinglePlayerGame(this.game.game_id, won);
    }
  }

  flipLetter(index: number, letter: string, row: number): void {
    const currentAttempt = this.board[row];
    const correctWord = this.solution.split('');
    const solutionLetterCounts: { [key: string]: number } = {};
    const correctMatches: boolean[] = Array(currentAttempt.length).fill(false);
  
    // Initialize counts for each letter in the solution
    correctWord.forEach(letter => {
      solutionLetterCounts[letter] = (solutionLetterCounts[letter] || 0) + 1;
    });
  
    // First pass: Mark correct-position letters with "correct" class after flip animation
    currentAttempt.forEach((letter, index) => {
      const cellElement = this.el.nativeElement.querySelector(`.row:nth-child(${row + 1}) .cell:nth-child(${index + 1})`);
      const isCorrectPosition = letter === correctWord[index];
  
      if (isCorrectPosition) {
        // Start the flip animation
        setTimeout(() => {
          this.renderer.addClass(cellElement, 'flip');
  
          // Add the correct color class after the flip starts
          setTimeout(() => {
            this.renderer.addClass(cellElement, 'correct'); // Green for correct position
            cellElement.textContent = letter;
            this.updateKeyboard(letter, 'correct');
          }, this.newColorDelay); // Delay for color change to occur during flip
  
        }, index * this.newFlipDelay);
  
        correctMatches[index] = true; // Mark this letter as correctly matched
        solutionLetterCounts[letter]--; // Reduce the count of this letter in solution
      }
    });
  
    // Second pass: Mark letters that are present but in the wrong position with "present"
    currentAttempt.forEach((letter, index) => {
      const cellElement = this.el.nativeElement.querySelector(`.row:nth-child(${row + 1}) .cell:nth-child(${index + 1})`);
      const isCorrectPosition = correctMatches[index];
  
      if (!isCorrectPosition && solutionLetterCounts[letter] > 0) {
        setTimeout(() => {
          this.renderer.addClass(cellElement, 'flip');
          setTimeout(() => {
            this.renderer.addClass(cellElement, 'present'); // Yellow for present but wrong position
            cellElement.textContent = letter;
            this.updateKeyboard(letter, 'present');
          }, this.newColorDelay);
        }, index * this.newFlipDelay);
  
        solutionLetterCounts[letter]--;
      } else if (!isCorrectPosition) {
        // If the letter is absent
        setTimeout(() => {
          this.renderer.addClass(cellElement, 'flip');
          setTimeout(() => {
            this.renderer.addClass(cellElement, 'absent'); // Grey for absent letter
            cellElement.textContent = letter;
            this.updateKeyboard(letter, 'absent');
          }, this.newColorDelay);
        }, index * this.newFlipDelay);
      }
    });
  }

  updateKeyboard(letter: string, status: string): void {
    const keyElement = this.el.nativeElement.querySelector(`.key[data-key="${letter.toLowerCase()}"]`);
    if (keyElement) {
      // Prioritize the status: "correct" > "present" > "absent"
      if (status === 'correct') {
        // Upgrade to 'correct' regardless of current status
        this.renderer.removeClass(keyElement, 'present');
        this.renderer.removeClass(keyElement, 'absent');
        this.renderer.addClass(keyElement, 'correct');
      } else if (status === 'present' && !keyElement.classList.contains('correct')) {
        // Only upgrade to 'present' if it hasn't been marked 'correct'
        this.renderer.removeClass(keyElement, 'absent');
        this.renderer.addClass(keyElement, 'present');
      } else if (status === 'absent' && !keyElement.classList.contains('present') && !keyElement.classList.contains('correct')) {
        // Only set to 'absent' if it hasn't been marked as 'present' or 'correct'
        this.renderer.addClass(keyElement, 'absent');
      }
    }
  }


  showMessage(message: string, duration: number): void {
    this.message = message;
    this.messageIsVisible = true;
    setTimeout(() => {
      this.messageIsVisible = false;
      this.message = '';
    }, duration);
  }

  // Add your wave animation
  triggerWaveAnimation(element: HTMLElement): void {
    if (element) {
      const cells = element.querySelectorAll('.cell');
      cells.forEach((cell, index) => {
      setTimeout(() => {
          this.renderer.addClass(cell, 'wave');
      }, index * 100); // Stagger the animation for each letter
      });
    }
  }

  wiggleRow(rowIndex: number): void {
    const rowElement = this.el.nativeElement.querySelectorAll('.row')[rowIndex];
    if (rowElement) {
      rowElement.classList.add('wiggle');
      setTimeout(() => {
        rowElement.classList.remove('wiggle');
      }, this.wiggleDuration); // Duration of the wiggle animation
    }
  }
}
