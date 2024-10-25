import { Component } from '@angular/core';
import { DataService } from '../services/data.service';
import { SharedModule } from '../modules/shared.module';
import { MaterialModule } from '../modules/material.module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-avatars',
  standalone: true,
  imports: [SharedModule, MaterialModule],
  templateUrl: './avatars.component.html',
  styleUrl: './avatars.component.css'
})

export class AvatarsComponent {
  avatars: any; 
  constructor(private dataservice:DataService, private router: Router){}

  ngOnInit(){
    this.dataservice.getAvatars().subscribe({
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
    this.dataservice.assignAvatar({user_id:user_id, avatar_num:id}).subscribe({
      next: (response) => {
        this.dataservice.uponLogin(response, null)
        this.router.navigate(['/game'])
      }, error: (error) => {
        console.error('Error assinging avatar: ', error)
      }
    })
  }
}
