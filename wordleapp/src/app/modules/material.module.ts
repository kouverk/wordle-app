import { NgModule } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

const modules = [
  MatCardModule,
  MatInputModule,
  MatButtonModule
];

@NgModule({
  imports: modules,
  exports: modules,
})
export class MaterialModule {}
