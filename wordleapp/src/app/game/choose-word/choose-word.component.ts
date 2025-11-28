import { Component, OnInit } from '@angular/core';
import { MaterialModule } from 'src/app/modules/material.module';
import { SharedModule } from 'src/app/modules/shared.module';
import { GameService } from 'src/app/services/game.service';
import { Game } from 'src/app/services/interfaces';

@Component({
  selector: 'app-choose-word',
  standalone: true,
  imports: [MaterialModule, SharedModule],
  templateUrl: './choose-word.component.html',
  styleUrl: './choose-word.component.css'
})
export class ChooseWordComponent implements OnInit {
  words: Array<{word: string}> = [];
  selectedWord: { word: string } | null = null;
  game: Game | null = null;

  constructor(private gameservice: GameService) {}

  ngOnInit() {
    // Get the current game so we have the game_id
    this.gameservice.game$.subscribe(game => {
      this.game = game;
    });

    this.gameservice.getWordChoices().subscribe({
      next: (response) => {
        this.words = response;
      },
      error: (error) => {
        console.error('Failed to fetch word choices:', error);
      }
    });
  }

  selectWord(word: { word: string }): void {
    this.selectedWord = word;
    if (this.game) {
      // Update the game with the selected word, then navigate to /wait
      this.gameservice.updateGameWord(this.game.game_id, word.word);
    }
  }
}
