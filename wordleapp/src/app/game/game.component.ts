import { Component, HostListener } from '@angular/core';
import { MaterialModule } from '../modules/material.module';
import { SharedModule } from '../modules/shared.module';

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
  firstRow: string[] = 'QWERTYUIOP'.split('');
  secondRow: string[] = 'ASDFGHJKL'.split('');
  thirdRow: string[] = 'ZXCVBNM'.split('');

  // Listen for keydown events
  @HostListener('document:keydown', ['$event'])
  handleKeyboardInput(event: KeyboardEvent) {
    const key = event.key.toUpperCase(); // Convert key to uppercase for consistency
    console.log('this is key', key)
    // Check if the key is a letter from A to Z
    if (this.isLetter(key)) {
      this.fillBoxWithLetter(key);
    } else if (key === 'ENTER') {
      this.onEnterClick();
    } else if (key === 'BACKSPACE') {
      this.onDeleteClick();
    }
  }

  isLetter(key: string): boolean {
    return /^[A-Z]$/.test(key); // Check if the key is a letter A-Z
  }

  fillBoxWithLetter(letter: string) {
    if (this.currentRow < this.board.length) {
      const row = this.board[this.currentRow];
      const firstEmptyIndex = row.indexOf(''); // Find the first empty box

      if (firstEmptyIndex !== -1) {
        row[firstEmptyIndex] = letter; // Fill the box with the letter
      }
    }
  }

  onEnterClick() {
    console.log('Enter clicked');
    // Implement enter key logic here
    this.currentRow++; // Move to the next row after entering a guess
  }

  onDeleteClick() {
    console.log('Delete clicked');
    if (this.currentRow < this.board.length) {
      const row = this.board[this.currentRow];
      const lastFilledIndex = row.lastIndexOf(''); // Find the last empty box
  
      if (lastFilledIndex !== -1) {
        // If there's at least one filled box, we want to delete the last letter
        const lastLetterIndex = lastFilledIndex - 1; // Find the index of the last filled box
        if (lastLetterIndex >= 0) {
          row[lastLetterIndex] = ''; // Remove the letter from the last filled box
        }
      }
    }
  }

  onLetterClick(letter: string) {
    this.fillBoxWithLetter(letter); // Fill the box with the clicked letter
  }
}