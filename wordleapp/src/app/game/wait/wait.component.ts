import { Component } from '@angular/core';
import { GameService } from 'src/app/services/game.service';
import { Game } from 'src/app/services/interfaces';

@Component({
  selector: 'app-wait',
  standalone: true,
  imports: [],
  templateUrl: './wait.component.html',
  styleUrl: './wait.component.css'
})
export class WaitComponent {
  constructor(private gameservice: GameService){

  }
  ngOnInit(){
    this.gameservice.game$.subscribe(game => {

    })
  }
}
