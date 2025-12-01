import { Component, OnInit, OnDestroy } from '@angular/core';
import { MaterialModule } from 'src/app/modules/material.module';
import { SharedModule } from 'src/app/modules/shared.module';
import { GameService } from 'src/app/services/game.service';
import { Game, MultiplayerGame } from 'src/app/services/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-choose-word',
  standalone: true,
  imports: [MaterialModule, SharedModule],
  templateUrl: './choose-word.component.html',
  styleUrl: './choose-word.component.css'
})
export class ChooseWordComponent implements OnInit, OnDestroy {
  words: Array<{word: string}> = [];
  selectedWord: { word: string } | null = null;
  game: Game | null = null;
  private wordsFetched: boolean = false;
  private wordSubmitted: boolean = false;
  private gameSubscription: Subscription | null = null;

  constructor(private gameservice: GameService) {}

  ngOnInit() {
    // Get the current game so we have the game_id and player IDs
    this.gameSubscription = this.gameservice.game$.subscribe(game => {
      this.game = game;

      // Only fetch word choices ONCE when we have a valid game and haven't already fetched
      // Also skip if a word was already submitted (prevents re-fetch after updateGameWord)
      if (game && this.isMultiplayerGame(game) && !this.wordsFetched && !this.wordSubmitted) {
        this.wordsFetched = true; // Mark as fetched BEFORE the async call
        this.gameservice.getWordChoices(game.player1_id, game.player2_id).subscribe({
          next: (response) => {
            this.words = response;
          },
          error: (error) => {
            console.error('Failed to fetch word choices:', error);
            this.wordsFetched = false; // Allow retry on error
          }
        });
      }
    });
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks and stale callbacks
    if (this.gameSubscription) {
      this.gameSubscription.unsubscribe();
    }
  }

  // Type guard to check if game is multiplayer
  private isMultiplayerGame(game: Game): game is MultiplayerGame {
    return game.game_type === 'multiplayer';
  }

  selectWord(word: { word: string }): void {
    // Prevent double submission
    if (this.wordSubmitted) {
      return;
    }
    this.wordSubmitted = true;
    this.selectedWord = word;
    if (this.game) {
      // Update the game with the selected word, then navigate to /wait
      this.gameservice.updateGameWord(this.game.game_id, word.word);
    }
  }
}
