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
      }, index * 500); // Adjust the timing here for the delay
    });

    // Move to the next row and update currentWord after the last animation
    setTimeout(() => {
      this.currentRow++;
      this.currentCol = 0;
      this.currentWord = attemptedWord.join('');
      this.animationInProgress = false;
    }, attemptedWord.length * 500); // After all letters have flipped
  }

  flipLetter(index: number, letter: string): void {
    const currentAttempt = this.board[this.currentRow];
    const correctWord = this.solution.split('');

    currentAttempt.forEach((letter, index) => {
      const cellElement = this.el.nativeElement.querySelector(`.row:nth-child(${this.currentRow + 1}) .cell:nth-child(${index + 1})`);
      const isCorrectPosition = letter === correctWord[index];
      const isInSolution = correctWord.includes(letter) && !isCorrectPosition;

      // Apply flip class
      setTimeout(() => {
        this.renderer.addClass(cellElement, 'flip');

        // Set appropriate classes for colors
        if (isCorrectPosition) {
          this.renderer.addClass(cellElement, 'correct');
        } else if (isInSolution) {
          this.renderer.addClass(cellElement, 'present');
        } else {
          this.renderer.addClass(cellElement, 'absent');
        }

        // Show the letter normally after flip
        cellElement.textContent = letter; 
      }, index * 500);
    });
  }

  wiggleRow(rowIndex: number): void {
    const rowElement = this.el.nativeElement.querySelectorAll('.row')[rowIndex];
    console.log('here is rowElement', rowElement)
    if (rowElement) {
      rowElement.classList.add('wiggle');
      setTimeout(() => {
        rowElement.classList.remove('wiggle');
      }, 650); // Duration of the wiggle animation
    }
  }
}
