import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Other Angular Material modules can be imported here as well as you scale

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    // Export common Angular modules
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    // Add any other Material or custom modules here
  ]
})
export class SharedModule {}
