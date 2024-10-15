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
    console.log('you selected number: ', id)
    this.router.navigate(['/game'])
  }
}
