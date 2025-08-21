import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoavaliacoesIndexComponent } from './autoavaliacoes-index.component';

describe('TermometroIndexComponent', () => {
  let component: AutoavaliacoesIndexComponent;
  let fixture: ComponentFixture<AutoavaliacoesIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoavaliacoesIndexComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutoavaliacoesIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
