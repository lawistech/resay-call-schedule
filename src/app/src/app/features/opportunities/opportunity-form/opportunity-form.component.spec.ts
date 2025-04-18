import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityFormComponent } from './opportunity-form.component';

describe('OpportunityFormComponent', () => {
  let component: OpportunityFormComponent;
  let fixture: ComponentFixture<OpportunityFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunityFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OpportunityFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
