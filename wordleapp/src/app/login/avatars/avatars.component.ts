import { Component } from '@angular/core';
import { GameService } from '../../services/game.service';
import { SharedModule } from '../../modules/shared.module';
import { MaterialModule } from '../../modules/material.module';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-avatars',
  standalone: true,
  imports: [SharedModule, MaterialModule],
  templateUrl: './avatars.component.html',
  styleUrl: './avatars.component.css'
})

export class AvatarsComponent {
  avatars: any; 
  constructor(private authservice:AuthService, private gameservice: GameService, private router: Router){}

  ngOnInit(){
    this.authservice.getAvatars().subscribe({
      next: (data) => {
        this.avatars = data
      },
      error: (error) => {
        console.error('Error fetching avatars:', error);
      },
    });
  }

  onSelection(id:number){
    const user_id = Number(localStorage.getItem('user_id'))
    this.authservice.assignAvatar({user_id:user_id, avatar_num:id}).subscribe({
      next: (response) => {
        this.gameservice.uponLogin(response, null, null)
        this.router.navigate(['/game'])
      }, error: (error) => {
        console.error('Error assinging avatar: ', error)
      }
    })
  }
}
