import { Component, ViewChild } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './modules/material.module';
import { AuthService } from './services/auth.service';
import { SharedModule } from './modules/shared.module';
import { MatSidenav } from '@angular/material/sidenav';
import { GameService } from './services/game.service';
import { MatExpansionPanel } from '@angular/material/expansion';
import { User } from './services/interfaces';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule, SharedModule, MaterialModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'wordleapp';
  opened: boolean = false;
  users: User[] = []; // List of users
  loggedin_id: number | null = null;
  isLoggedIn: boolean = false; 
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild('expansionPanel') expansionPanel!: MatExpansionPanel;

  constructor(
    private authService: AuthService,
    private router: Router,
    private gameService: GameService
  ) {}

  ngOnInit() {
    // Fetch users if the user is logged in
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn
      if (isLoggedIn) {
        const user_id = localStorage.getItem('user_id');
        if (user_id) {
          this.loggedin_id = parseInt(user_id, 10);
          this.loadUsers();
        }
      } else {
        this.loggedin_id = null;
        this.users = [];
      }
    });
  }

  private loadUsers() {
    this.authService.getUsers().subscribe({
      next: (data: User[]) => {
        this.users = data.filter(item => item?.user_id !== this.loggedin_id);
      },
      error: (err) => {
        console.error('Failed to fetch users', err);
      }
    });
  }

  // Method to start a multiplayer game if logged in
  startGameWithUser(user: User) {
    if (this.loggedin_id && user) {  // Only proceed if logged in
      this.gameService.retrieveMultiPlayerGame(this.loggedin_id, user.user_id);
      this.closeSidenav(); // Close sidenav after starting game
    }
  }

  // Method to handle single-player game selection
  startSinglePlayer() {
    if (this.loggedin_id) {  // Proceed if logged in
      this.sidenav.close();
      // Additional logic for starting single-player game can go here
    } 
  }

  // Method to close the sidenav
  closeSidenav() {
    this.sidenav.close();
  }

  // Method to log out and reset the state
  logout() {
    this.sidenav.close();
    this.loggedin_id = null;
    this.isLoggedIn = false; 
    this.users = [];
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
