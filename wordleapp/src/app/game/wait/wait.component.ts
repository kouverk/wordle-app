import { Component } from '@angular/core';
import { SharedModule } from 'src/app/modules/shared.module';
import { GameService } from 'src/app/services/game.service';
import { Game, MultiplayerGame } from 'src/app/services/interfaces';

@Component({
  selector: 'app-wait',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './wait.component.html',
  styleUrls: ['./wait.component.css']
})
export class WaitComponent {
  game: Game | null = null;
  multiplayerGame: MultiplayerGame | null = null;
  loggedin_username: string | null = null; 
  opponent_username: string | null = null; 
  
  constructor(private gameservice: GameService) {}

  ngOnInit() {
    this.gameservice.game$.subscribe(game => {
      this.game = game;
      
      // Narrow down to MultiplayerGame using the type guard
      if (this.isMultiplayerGame(game)) {
        this.multiplayerGame = game;
        this.loggedin_username = this.gameservice.getCurrentUser();
        console.log('loggedin_username', this.loggedin_username)
        // Check if logged-in user is player1 or player2, and set opponent username
        console.log('game', game)
        if (game.player1_username === this.loggedin_username) {
          this.opponent_username = game.player2_username;
        } else {
          this.opponent_username = game.player1_username;
        }
      } else {
        // Handle non-multiplayer cases if necessary
        this.multiplayerGame = null;
      }
    });
  }

  // Type guard to check if game is MultiplayerGame
  isMultiplayerGame(game: Game | null): game is MultiplayerGame {
    return game?.game_type === 'multiplayer';
  }
}
