import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SharedModule } from 'src/app/modules/shared.module';
import { GameService } from 'src/app/services/game.service';
import { Game, MultiplayerGame } from 'src/app/services/interfaces';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-wait',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './wait.component.html',
  styleUrls: ['./wait.component.css']
})
export class WaitComponent implements OnInit, OnDestroy {
  game: Game | null = null;
  multiplayerGame: MultiplayerGame | null = null;
  loggedin_username: string | null = null;
  loggedin_id: number | null = null;
  opponent_username: string | null = null;
  private pollingSubscription: Subscription | null = null;
  private gameSubscription: Subscription | null = null;
  private gameInitialized: boolean = false;

  constructor(
    private gameservice: GameService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loggedin_id = Number(localStorage.getItem('user_id'));
    }

    this.gameSubscription = this.gameservice.game$.subscribe(game => {
      this.game = game;

      // Narrow down to MultiplayerGame using the type guard
      if (this.isMultiplayerGame(game)) {
        this.multiplayerGame = game;
        this.loggedin_username = this.gameservice.getCurrentUser();
        // Check if logged-in user is player1 or player2, and set opponent username
        if (game.player1_username === this.loggedin_username) {
          this.opponent_username = game.player2_username;
        } else {
          this.opponent_username = game.player1_username;
        }

        // Only start polling once on first valid game load
        if (!this.gameInitialized) {
          this.gameInitialized = true;
          this.startPolling();
        }
      } else {
        // Handle non-multiplayer cases if necessary
        this.multiplayerGame = null;
      }
    });
  }

  ngOnDestroy() {
    this.stopPolling();
    if (this.gameSubscription) {
      this.gameSubscription.unsubscribe();
    }
  }

  private startPolling() {
    // Don't start if already polling or no game
    if (this.pollingSubscription || !this.multiplayerGame) {
      return;
    }

    // Poll every 5 seconds
    this.pollingSubscription = interval(5000).subscribe(() => {
      if (this.multiplayerGame && this.loggedin_id) {
        this.gameservice.checkGameStatus(this.multiplayerGame.game_id).subscribe({
          next: (status) => {
            // If it's now our turn and there's a word to guess, navigate to game
            if (status.player_turn === this.loggedin_id && status.has_word) {
              this.stopPolling();
              // Reload the full game data before navigating
              this.gameservice.retrieveMultiPlayerGame(this.loggedin_id!, this.getOpponentId());
            }
            // If the turn completed and there's a new game, reload to get latest state
            else if (status.turn_completed && status.game_id) {
              this.stopPolling();
              this.gameservice.retrieveMultiPlayerGame(this.loggedin_id!, this.getOpponentId());
            }
          },
          error: (err) => {
            console.error('Polling error:', err);
          }
        });
      }
    });
  }

  private stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  private getOpponentId(): number {
    if (!this.multiplayerGame || !this.loggedin_id) return 0;
    return this.multiplayerGame.player1_id === this.loggedin_id
      ? this.multiplayerGame.player2_id
      : this.multiplayerGame.player1_id;
  }

  // Type guard to check if game is MultiplayerGame
  isMultiplayerGame(game: Game | null): game is MultiplayerGame {
    return game?.game_type === 'multiplayer';
  }
}
