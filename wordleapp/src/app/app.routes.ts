import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './login/signup/signup.component'
import { GameComponent } from './game/game.component';
import { AvatarsComponent } from './login/avatars/avatars.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'game', component: GameComponent},
  { path: 'avatars', component: AvatarsComponent},
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Default route
  { path: '**', redirectTo: '/login' }  // Wildcard route for a 404 page
];
