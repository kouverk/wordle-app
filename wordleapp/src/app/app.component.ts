import { Component, ViewChild } from '@angular/core';
import { Router, RouterOutlet} from '@angular/router';
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
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'wordleapp';
  opened: boolean = false; 
  users: any[] = []; // List of users
  loggedin_id: number  = 0; 
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild('expansionPanel') expansionPanel!: MatExpansionPanel;

  constructor(
    private authService: AuthService,
    private router: Router, 
    private gameservice: GameService
  ) {}

  ngOnInit() {
    // Fetch users if the user is logged in
    if (this.authService.userIsLoggedIn()) {
      this.authService.getUsers().subscribe({
        next: (data: Array<User>) => {
          const user_id = localStorage.getItem('user_id'); 
          if (user_id !== null) {
            this.loggedin_id = parseInt(user_id, 10);
          } else { 
            console.error('User ID is not found in local storage.')
          }
          // Filter out the logged-in user and assign it to this.users
          this.users = data.filter(item => item?.user_id !== this.loggedin_id);
          // Log the filtered users
        },
        error: (err) => {
          console.error('Failed to fetch users', err);
        }
      });
    }
  }

  startGameWithUser(user:User) {
    // Additional game-start logic
    if(user){
      this.gameservice.retrieveMultiPlayerGame(this.loggedin_id, user.user_id)
    }
    
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
