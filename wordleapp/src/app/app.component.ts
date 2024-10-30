import { Component, ViewChild } from '@angular/core';
import { Router, RouterOutlet} from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './modules/material.module';
import { AuthService } from './services/auth.service';
import { SharedModule } from './modules/shared.module';
import { MatSidenav } from '@angular/material/sidenav';
import { GameService } from './services/game.service';
import { MatExpansionPanel } from '@angular/material/expansion';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule, SharedModule, MaterialModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'wordleapp';
  opened: boolean = false; 
  users: any[] = []; // List of users
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild('expansionPanel') expansionPanel!: MatExpansionPanel;

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private router: Router
  ) {}

  ngOnInit() {
    // Fetch users if the user is logged in
    if (this.authService.userIsLoggedIn()) {
      this.authService.getUsers().subscribe({
        next: (data: any) => {
          this.users = data;
          console.log(this.users);
        },
        error: (err) => {
          console.error('Failed to fetch users', err);
        }
      });
    }
  }

  startGameWithUser(user: any) {
    console.log('Starting a game with user:', user.username);
    // Additional game-start logic
  }

  startSinglePlayer() {
    this.sidenav.close();
  }

  logout() {
    this.sidenav.close();
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // Method to close the expansion panel when sidenav closes
  closeExpansionPanel() {
    if (this.expansionPanel) {
      this.expansionPanel.close();
    }
  }
}
