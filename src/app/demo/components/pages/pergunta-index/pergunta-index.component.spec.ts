import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerguntaIndexComponent } from './pergunta-index.component';

describe('TermometroIndexComponent', () => {
  let component: PerguntaIndexComponent;
  let fixture: ComponentFixture<PerguntaIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerguntaIndexComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerguntaIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
