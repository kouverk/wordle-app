import { Component, OnInit, Renderer2, ElementRef, ChangeDetectorRef } from '@angular/core';
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
  waveDuration = 300; 
  wiggleDuration = 650; 
  messageIsVisible: boolean = false; 
  message: string = ''; 
  isInitialLoad: boolean = true; 

  constructor(private gameservice: GameService, private renderer: Renderer2, private el: ElementRef, private cdr: ChangeDetectorRef){}

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
        this.solution = this.game.word; 
      }
    });

    // Subscribe to attempts updates
    this.gameservice.attempts$.subscribe(attempts => {
      this.attempts = attempts; // Update attempts variable
      this.cdr.detectChanges();  // Manually trigger change detection
      if (this.isInitialLoad){ //Only update the template if this hasn't fire yet so it doesnt conflict with the animateWord sequence
        this.updateBoardWithAttempts(); // Update board display with attempts
        this.isInitialLoad = false; 
      }
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
    console.log('update board with attempts ')
    if (this.attempts && this.attempts.length) {
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
    if (this.currentCol === 5) {      
      this.gameservice.checkWord(this.currentWord).subscribe({
        next: (data) => {
          if (data.exists) {
            this.gameservice.addAttemptsData(this.currentWord, this.currentWord === this.solution, this.currentRow);
            this.animateWord(this.board[this.currentRow], this.currentRow); // Pass currentRow
          } else {
            this.wiggleRow(this.currentRow);
            this.showMessage('Not a word diva 😭', 1500);
          }
        },
        error: (error) => {
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
  
      if (this.currentWord === this.solution) {
        const currentRowElement = this.el.nativeElement.querySelector(`.row:nth-child(${row + 1})`);
        this.triggerWaveAnimation(currentRowElement);
        setTimeout(() => {
          this.showMessage('Great Job Pwincess 🤩', 4000);
        }, this.waveDuration);
      }
    }, attemptedWord.length * this.nextRowDelay);
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
