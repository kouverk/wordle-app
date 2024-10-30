import { Component } from '@angular/core';
import { MaterialModule } from 'src/app/modules/material.module';
import { SharedModule } from 'src/app/modules/shared.module';

@Component({
  selector: 'app-choose-word',
  standalone: true,
  imports: [MaterialModule, SharedModule],
  templateUrl: './choose-word.component.html',
  styleUrl: './choose-word.component.css'
})
export class ChooseWordComponent {

}
