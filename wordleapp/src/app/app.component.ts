import { Component, ViewChild } from '@angular/core';
import { Router, RouterOutlet} from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './modules/material.module';
import { AuthService } from './services/auth.service';
import { SharedModule } from './modules/shared.module';
import { MatSidenav } from '@angular/material/sidenav';

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

  logout(){
    localStorage.removeItem('authToken'); // Assuming you store JWT in localStorage
    this.sidenav.close();
    // localStorage.clear(); // To clear all storage (if needed)
    // Redirect to the login page
    this.router.navigate(['/login']);
  }
}
