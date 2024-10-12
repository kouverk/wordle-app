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
      },
      error: (error) => {
        console.error('Error fetching solution word:', error);
      },
    });
  }

  checkWord(word: string): void {
    this.dataservice.checkWord(word).subscribe({
      next: (data) => {
        if (data.exists) {
          // Handle word success (e.g., update the board, mark word as valid)
          this.currentRow++;
          this.currentCol = 0;
          this.currentWord = '';  // Reset current word after submission
        } else {
          this.wiggleRow(this.currentRow);
        }
      },
      error: (error) => {
        console.error('Error checking word:', error);
      }
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
      this.checkWord(this.currentWord);
      // Move to the next row after word submission
    } else {
      alert('Word must be 5 letters long!');
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
