import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunitySuccessModalComponent } from './opportunity-success-modal.component';

describe('OpportunitySuccessModalComponent', () => {
  let component: OpportunitySuccessModalComponent;
  let fixture: ComponentFixture<OpportunitySuccessModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunitySuccessModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OpportunitySuccessModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
