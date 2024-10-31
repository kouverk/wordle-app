import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './login/signup/signup.component';
import { GameComponent } from './game/game.component';
import { AvatarsComponent } from './login/avatars/avatars.component';
import { authGuard } from './auth.guard';
import { ChooseWordComponent } from './game/choose-word/choose-word.component';
import { WaitComponent } from './game/wait/wait.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'game', component: GameComponent, canActivate: [authGuard] }, 
  { path: 'avatars', component: AvatarsComponent, canActivate: [authGuard] }, 
  { path: 'choose-word', component: ChooseWordComponent },
  { path: 'wait', component: WaitComponent},
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Default route
  { path: '**', redirectTo: '/login' }  // Wildcard route for a 404 page
];
