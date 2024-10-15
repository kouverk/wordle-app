import { Component } from '@angular/core';
import { Router, RouterOutlet} from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './modules/material.module';
import { AuthService } from './services/auth.service';
import { SharedModule } from './modules/shared.module';

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

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.users = [{username:'fane'}, {username:'greg'}]
    // // Fetch users from the server
    // this.authService.getUsers().subscribe({
    //   next: (data: any) => {
    //     this.users = data.users;  // Assuming API returns a "users" array
    //   },
    //   error: (err) => {
    //     console.error('Failed to fetch users', err);
    //   }
    // });
  }

  startGameWithUser(user: any) {
    console.log('Starting a game with user:', user.username);

    // Logic to create a multiplayer game with the selected user
    // Assuming you have a route for starting a game with a user ID
    
  }
}
