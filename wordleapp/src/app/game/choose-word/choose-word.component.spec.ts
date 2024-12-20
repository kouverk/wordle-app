import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseWordComponent } from './choose-word.component';

describe('ChooseWordComponent', () => {
  let component: ChooseWordComponent;
  let fixture: ComponentFixture<ChooseWordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseWordComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChooseWordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
