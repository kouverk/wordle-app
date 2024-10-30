import { Component } from '@angular/core';
import { MaterialModule } from 'src/app/modules/material.module';
import { SharedModule } from 'src/app/modules/shared.module';
import { GameService } from 'src/app/services/game.service';

@Component({
  selector: 'app-choose-word',
  standalone: true,
  imports: [MaterialModule, SharedModule],
  templateUrl: './choose-word.component.html',
  styleUrl: './choose-word.component.css'
})

export class ChooseWordComponent {
  words: Array<{word: string}> = [];
  selectedWord: { word: string } | null = null; // Add selectedWord property

  constructor(private gameservice: GameService){}

  ngOnInit(){
    this.gameservice.getWordChoices().subscribe({
      next: (response) => {
        this.words = response
      }, 
      error: (error) => {

      }
    })
  }

  selectWord(word: { word: string }): void {
    this.selectedWord = word;
    console.log('Selected word:', word);
    // Here, you can add any additional action you want to perform on word selection
  }
}
