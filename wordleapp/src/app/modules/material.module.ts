import { NgModule } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRippleModule } from '@angular/material/core';
import {MatDividerModule} from '@angular/material/divider';

const modules = [
  MatCardModule,
  MatInputModule,
  MatButtonModule, 
  MatIconModule, 
  MatListModule, 
  MatToolbarModule, 
  MatSidenavModule, 
  MatExpansionModule, 
  MatRippleModule, 
  MatDividerModule
];

@NgModule({
  imports: modules,
  exports: modules,
})
export class MaterialModule {}
