import { Component, OnInit, Renderer2, ElementRef } from '@angular/core';
import { MaterialModule } from '../modules/material.module';
import { SharedModule } from '../modules/shared.module';
import { GameService } from '../services/game.service';
import { Game, Attempts } from '../services/interfaces'; // Ensure Attempts is imported

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [SharedModule, MaterialModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'] // Fix typo from styleUrl to styleUrls
})
export class GameComponent implements OnInit {
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
  waveDuration = 400; 
  wiggleDuration = 600; 
  messageIsVisible: boolean = false; 
  message: string = ''; 

  constructor(private gameservice: GameService, private renderer: Renderer2, private el: ElementRef){}

  ngOnInit() {
    // Subscribe to game updates
    this.gameservice.game$.subscribe(game => {
      this.game = game; // Update the component's game variable
      if (this.game == null){
        // Start single player game by retrieving a solution word
        this.fetchSolution();
        this.multiplayer = false;
      } else {
        this.multiplayer = true; 
        // Fill this in to load the game 
      }
    });

    // Subscribe to attempts updates
    this.gameservice.attempts$.subscribe(attempts => {
      this.attempts = attempts; // Update attempts variable
      this.updateBoardWithAttempts(); // Update board display with attempts
    });

    // Listen for keyboard events using Renderer2
    this.renderer.listen('window', 'keydown', (event: KeyboardEvent) => {
      this.handleKeyPress(event);
    });
  }

  // Fetch the solution from the server
  fetchSolution(): void {
    this.gameservice.getSolution().subscribe({
      next: (data) => {
        this.solution = data.word;
        console.log(this.solution);
      },
      error: (error) => {
        console.error('Error fetching solution word:', error);
      },
    });
  }

  // Update board based on attempts data
  updateBoardWithAttempts(): void {
    if (this.attempts && this.attempts.length) {
      this.attempts.forEach((attempt, attemptIndex) => {
        const attemptRow = attempt.attempt_num - 1; // Assuming attempt_num is 1-based
        const attemptLetters = attempt.attempt.split('');
        const solutionLetters = this.solution.split('');
  
        // Track counts of letters in the solution and matches in correct positions
        const solutionLetterCounts: { [key: string]: number } = {};
        const correctMatches: boolean[] = Array(attemptLetters.length).fill(false);
  
        // Initialize letter counts for the solution
        solutionLetters.forEach(letter => {
          solutionLetterCounts[letter] = (solutionLetterCounts[letter] || 0) + 1;
        });
  
        // First pass: assign "correct" class to letters in the correct position
        attemptLetters.forEach((letter, letterIndex) => {
          const cellElement = this.el.nativeElement.querySelector(`.row:nth-child(${attemptRow + 1}) .cell:nth-child(${letterIndex + 1})`);
          const isCorrectPosition = letter === solutionLetters[letterIndex];
  
          if (isCorrectPosition) {
            if (cellElement) {
              cellElement.textContent = letter;
              this.renderer.addClass(cellElement, 'correct'); // Green for correct position
            }
            correctMatches[letterIndex] = true; // Mark this letter as correctly matched
            solutionLetterCounts[letter]--; // Reduce the count of this letter in solution
            this.updateKeyboard(letter, 'correct');
          }
        });
  
        // Second pass: assign "present" class to letters in the wrong position if they exist in solution
        attemptLetters.forEach((letter, letterIndex) => {
          const cellElement = this.el.nativeElement.querySelector(`.row:nth-child(${attemptRow + 1}) .cell:nth-child(${letterIndex + 1})`);
          const isCorrectPosition = correctMatches[letterIndex];
          
          if (!isCorrectPosition && solutionLetterCounts[letter] > 0) { // Check if there are remaining occurrences
            if (cellElement) {
              cellElement.textContent = letter;
              this.renderer.addClass(cellElement, 'present'); // Yellow for present but wrong position
            }
            solutionLetterCounts[letter]--; // Reduce the count of this letter in solution
            this.updateKeyboard(letter, 'present');
          } else if (!isCorrectPosition) {
            // If the letter is not in the solution
            if (cellElement) {
              cellElement.textContent = letter;
              this.renderer.addClass(cellElement, 'absent'); // Grey for absent letter
            }
            this.updateKeyboard(letter, 'absent');
          }
        });
  
        // Set the currentRow and currentCol to the next row after the last attempt
        if(this.attempts){
          this.currentRow = this.attempts.length;
          this.currentCol = 0;
        }
      });
    }
  }
  


  // Handle key press events
  handleKeyPress(event: KeyboardEvent): void {
    const key = event.key.toUpperCase();
    
    // Check if the key pressed is a letter
    if (this.isLetter(key)) {
      this.handleLetterInput(key);
    } else if (key === 'ENTER') {
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

  handleEnter(): void {
    // Check if the current word is complete and can be submitted
    if (this.currentCol === 5) {      
      // Check if the word exists in the database
      this.gameservice.checkWord(this.currentWord).subscribe({
        next: (data) => {
          if (data.exists) {
            // Handle word success (e.g., update the board, mark word as valid)
            this.animateWord(this.board[this.currentRow]);
          } else {
            this.wiggleRow(this.currentRow);
            this.showMessage('Not a word diva 😭', 1500);
          }
        },
        error: (error) => {
          console.error('Error checking word:', error);
        }
      });
      // Move to the next row after word submission
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

  animateWord(attemptedWord: string[]): void {
    this.animationInProgress = true;
    
    attemptedWord.forEach((letter, index) => {
      setTimeout(() => {
        this.flipLetter(index, letter);
      }, index * this.newFlipDelay); // Adjust the timing here for the delay
    });

    // Move to the next row and update currentWord after the last animation
    setTimeout(() => {
      this.currentRow++;
      this.currentCol = 0;
      this.currentWord = attemptedWord.join('');
      this.animationInProgress = false;

      // Check if the guessed word matches the solution
      if (this.currentWord === this.solution) {
        const currentRowElement = this.el.nativeElement.querySelector(`.row:nth-child(${this.currentRow})`);
        this.triggerWaveAnimation(currentRowElement); // Trigger wave animation
        setTimeout(() => {
          this.showMessage('Great Job Pwincess 🤩', 2000);
        }, 350); // This should be equal to the wave duration from the css
      }
    }, attemptedWord.length * this.nextRowDelay); // After all letters have flipped
  }

  flipLetter(index: number, letter: string): void {
    const currentAttempt = this.board[this.currentRow]; // The current word attempt
    const correctWord = this.solution.split('');        // The solution word split into letters
  
    // Track counts of letters in the solution and matched letters
    const solutionLetterCounts: { [key: string]: number } = {};
    const correctMatches: boolean[] = Array(currentAttempt.length).fill(false);
  
    // Initialize letter counts for the solution
    correctWord.forEach(letter => {
      solutionLetterCounts[letter] = (solutionLetterCounts[letter] || 0) + 1;
    });
  
    // First pass: assign "correct" class to letters in the correct position
    currentAttempt.forEach((letter, index) => {
      const cellElement = this.el.nativeElement.querySelector(`.row:nth-child(${this.currentRow + 1}) .cell:nth-child(${index + 1})`);
      const isCorrectPosition = letter === correctWord[index];
  
      if (isCorrectPosition) {
        setTimeout(() => {
          this.renderer.addClass(cellElement, 'flip');
          setTimeout(() => {
            this.renderer.addClass(cellElement, 'correct'); // Green for correct position
            cellElement.textContent = letter;
            this.updateKeyboard(letter, 'correct');
          }, this.newColorDelay);
        }, index * this.newFlipDelay);
  
        correctMatches[index] = true; // Mark this letter as correctly matched
        solutionLetterCounts[letter]--; // Reduce the count of this letter in solution
      }
    });
  
    // Second pass: assign "present" class to letters in the wrong position if they exist in solution
    currentAttempt.forEach((letter, index) => {
      const cellElement = this.el.nativeElement.querySelector(`.row:nth-child(${this.currentRow + 1}) .cell:nth-child(${index + 1})`);
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
  
        solutionLetterCounts[letter]--; // Reduce the count of this letter in solution
      } else if (!isCorrectPosition) {
        // If the letter is not in the solution
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
      // Only update the key if it's not already marked as correct or present
      if (!keyElement.classList.contains('correct') && status === 'correct') {
        this.renderer.addClass(keyElement, 'correct');
      } else if (!keyElement.classList.contains('correct') && status === 'present' && !keyElement.classList.contains('absent')) {
        this.renderer.addClass(keyElement, 'present');
      } else if (!keyElement.classList.contains('correct') && !keyElement.classList.contains('present') && !keyElement.classList.contains('absent')) {
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
      const animationClass = 'wave-animation';
      this.renderer.addClass(element, animationClass);
      setTimeout(() => {
        this.renderer.removeClass(element, animationClass);
      }, this.waveDuration);
    }
  }

  wiggleRow(rowIndex: number): void {
    const rowElement = this.el.nativeElement.querySelector(`.row:nth-child(${rowIndex + 1})`);
    if (rowElement) {
      const animationClass = 'wiggle';
      this.renderer.addClass(rowElement, animationClass);
      setTimeout(() => {
        this.renderer.removeClass(rowElement, animationClass);
      }, this.wiggleDuration);
    }
  }
}
