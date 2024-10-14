import { Component, OnInit, Renderer2, ElementRef } from '@angular/core';
import { MaterialModule } from '../modules/material.module';
import { SharedModule } from '../modules/shared.module';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [SharedModule, MaterialModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent {
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
  isVisible : boolean = false; 
  message : string = ''; 

  constructor(private dataservice: DataService, private renderer: Renderer2, private el: ElementRef){}

  ngOnInit() {
    // Listen for keyboard events using Renderer2
    this.renderer.listen('window', 'keydown', (event: KeyboardEvent) => {
      this.handleKeyPress(event);
    });
    // Retrieve solution word
    this.fetchSolution();
  }

  // HTTP handling:
  fetchSolution(): void {
    this.dataservice.getSolution().subscribe({
      next: (data) => {
        this.solution = data.word;
        console.log(this.solution)
      },
      error: (error) => {
        console.error('Error fetching solution word:', error);
      },
    });
  }

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
      this.dataservice.checkWord(this.currentWord).subscribe({
        next: (data) => {
          if (data.exists) {
            // Handle word success (e.g., update the board, mark word as valid)
            this.animateWord(this.board[this.currentRow]);
          } else {
            this.wiggleRow(this.currentRow);
            this.showMessage('Not a word diva 😭', 1500)
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
          this.showMessage('Great Job Pwincess 🤩', 2000)
        }, 350); //This should be equal to the wave duration from the css
      }
    }, attemptedWord.length * this.nextRowDelay); // After all letters have flipped
  }

  flipLetter(index:number, letter:string): void {
    const currentAttempt = this.board[this.currentRow]; // The current word attempt
    const correctWord = this.solution.split('');        // The solution word split into letters

    // Loop through each letter in the current word attempt
    currentAttempt.forEach((letter: string, index: number) => {
        const cellElement = this.el.nativeElement.querySelector(`.row:nth-child(${this.currentRow + 1}) .cell:nth-child(${index + 1})`);
        const isCorrectPosition = letter === correctWord[index]; // Letter is in the correct position
        const isInSolution = correctWord.includes(letter) && !isCorrectPosition; // Letter is in the word but in the wrong position

        // Set a delay to apply the flip animation sequentially, one by one
        setTimeout(() => {
            // Apply the flip animation
            this.renderer.addClass(cellElement, 'flip');

            // Once the cell flips, assign the correct color based on letter status
            setTimeout(() => {
                if (isCorrectPosition) {
                    this.renderer.addClass(cellElement, 'correct'); // Green for correct position
                } else if (isInSolution) {
                    this.renderer.addClass(cellElement, 'present'); // Yellow for correct letter but wrong position
                } else {
                    this.renderer.addClass(cellElement, 'absent'); // Grey for absent letter
                }

                // Display the letter in the cell after the flip
                cellElement.textContent = letter;

                // Now update the virtual keyboard to reflect the same state
                this.updateKeyboard(letter, isCorrectPosition ? 'correct' : isInSolution ? 'present' : 'absent');
              }, this.newColorDelay); // Delay to finish the flip before changing the color
        }, index * this.newFlipDelay); // Delay each flip to occur one after another
    });
}

updateKeyboard(letter: string, status: string): void {
    const keyElement = this.el.nativeElement.querySelector(`.key[data-key="${letter.toLowerCase()}"]`);
    if (keyElement) {
        // Only update the key if it's not already marked as 'correct'
        if (!keyElement.classList.contains('correct')) {
            this.renderer.removeClass(keyElement, 'present');
            this.renderer.removeClass(keyElement, 'absent');
            this.renderer.addClass(keyElement, status); // Add the current status (correct, present, or absent)
        }
    }
}

triggerWaveAnimation(rowElement: HTMLElement): void {
  const cells = rowElement.querySelectorAll('.cell');
  
  cells.forEach((cell, index) => {
      setTimeout(() => {
          this.renderer.addClass(cell, 'wave');
      }, index * 100); // Stagger the animation for each letter
  });
}

showMessage(message:string, duration:number) {
  this.message = message;
  this.isVisible = true;
  setTimeout(()=>{
    this.message = '';
    this.isVisible = false;
  }, duration)
}

wiggleRow(rowIndex: number): void {
    const rowElement = this.el.nativeElement.querySelectorAll('.row')[rowIndex];
    if (rowElement) {
      rowElement.classList.add('wiggle');
      setTimeout(() => {
        rowElement.classList.remove('wiggle');
      }, 650); // Duration of the wiggle animation
    }
  }
}
