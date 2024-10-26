import { Component, ViewChild } from '@angular/core';
import { Router, RouterOutlet} from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './modules/material.module';
import { AuthService } from './services/auth.service';
import { SharedModule } from './modules/shared.module';
import { MatSidenav } from '@angular/material/sidenav';
import { GameService } from './services/game.service';

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
  users: any[] = [];  // This will store the list of users
  @ViewChild('sidenav') sidenav!: MatSidenav; // Reference to the sidenav

  constructor(private authService: AuthService, private gameservice: GameService, private router: Router) {}

  ngOnInit() {
    // // Fetch users from the server
    this.authService.getUsers().subscribe({
      next: (data: any) => {
        this.users = data 
        console.log(this.users)
      },
      error: (err) => {
        console.error('Failed to fetch users', err);
      }
    });
  }

  startGameWithUser(user: any) {
    console.log('Starting a game with user:', user.username);

    // Logic to create a multiplayer game with the selected user
    // Assuming you have a route for starting a game with a user ID
    
  }

  startSinglePlayer(){
    this.sidenav.close();
    this.gameservice.uponLogin(null, null)
  }

  logout(){
    localStorage.clear
    this.sidenav.close();
    // localStorage.clear(); // To clear all storage (if needed)
    // Redirect to the login page
    this.router.navigate(['/login']);
  }
}
