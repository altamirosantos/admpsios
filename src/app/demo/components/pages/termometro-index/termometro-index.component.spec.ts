import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermometroIndexComponent } from './termometro-index.component';

describe('TermometroIndexComponent', () => {
  let component: TermometroIndexComponent;
  let fixture: ComponentFixture<TermometroIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermometroIndexComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TermometroIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
