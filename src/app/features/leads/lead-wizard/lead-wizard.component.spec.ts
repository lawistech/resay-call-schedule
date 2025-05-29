import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { LeadWizardComponent } from './lead-wizard.component';
import { NotificationService } from '../../../core/services/notification.service';
import { CompanyService } from '../../companies/services/company.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LeadWizardStateService } from '../../../core/services/lead-wizard-state.service';

describe('LeadWizardComponent - Contact Validation', () => {
  let component: LeadWizardComponent;
  let fixture: ComponentFixture<LeadWizardComponent>;
  let formBuilder: FormBuilder;

  beforeEach(async () => {
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);
    const companyServiceSpy = jasmine.createSpyObj('CompanyService', ['searchCompanies']);
    const supabaseServiceSpy = jasmine.createSpyObj('SupabaseService', ['createContact']);
    const leadWizardStateServiceSpy = jasmine.createSpyObj('LeadWizardStateService', ['saveState', 'getState', 'clearState', 'hasState']);

    await TestBed.configureTestingModule({
      imports: [LeadWizardComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: CompanyService, useValue: companyServiceSpy },
        { provide: SupabaseService, useValue: supabaseServiceSpy },
        { provide: LeadWizardStateService, useValue: leadWizardStateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LeadWizardComponent);
    component = fixture.componentInstance;
    formBuilder = TestBed.inject(FormBuilder);

    // Initialize the component
    component.ngOnInit();
  });

  describe('atLeastOneContactValidator', () => {
    it('should return null when email is provided', () => {
      const testForm = formBuilder.group({
        email: ['test@example.com'],
        phone: [''],
        mobile: ['']
      });

      const result = component.atLeastOneContactValidator(testForm);
      expect(result).toBeNull();
    });

    it('should return null when phone is provided', () => {
      const testForm = formBuilder.group({
        email: [''],
        phone: ['(555) 123-4567'],
        mobile: ['']
      });

      const result = component.atLeastOneContactValidator(testForm);
      expect(result).toBeNull();
    });

    it('should return null when mobile is provided', () => {
      const testForm = formBuilder.group({
        email: [''],
        phone: [''],
        mobile: ['(555) 987-6543']
      });

      const result = component.atLeastOneContactValidator(testForm);
      expect(result).toBeNull();
    });

    it('should return null when multiple contact methods are provided', () => {
      const testForm = formBuilder.group({
        email: ['test@example.com'],
        phone: ['(555) 123-4567'],
        mobile: ['(555) 987-6543']
      });

      const result = component.atLeastOneContactValidator(testForm);
      expect(result).toBeNull();
    });

    it('should return error when no contact methods are provided', () => {
      const testForm = formBuilder.group({
        email: [''],
        phone: [''],
        mobile: ['']
      });

      const result = component.atLeastOneContactValidator(testForm);
      expect(result).toEqual({ atLeastOneContact: true });
    });

    it('should return error when only whitespace is provided', () => {
      const testForm = formBuilder.group({
        email: ['   '],
        phone: ['   '],
        mobile: ['   ']
      });

      const result = component.atLeastOneContactValidator(testForm);
      expect(result).toEqual({ atLeastOneContact: true });
    });

    it('should return null when only email has whitespace but phone has value', () => {
      const testForm = formBuilder.group({
        email: ['   '],
        phone: ['(555) 123-4567'],
        mobile: ['']
      });

      const result = component.atLeastOneContactValidator(testForm);
      expect(result).toBeNull();
    });
  });

  describe('Contact form validation integration', () => {
    it('should have atLeastOneContact error when no contact fields are filled', () => {
      component.contactForm.patchValue({
        full_name: 'John Doe',
        email: '',
        phone: '',
        mobile: '',
        job_title: 'Manager',
        notes: 'Test notes'
      });

      component.contactForm.markAsTouched();

      expect(component.contactForm.errors?.['atLeastOneContact']).toBeTruthy();
      expect(component.hasContactValidationError()).toBeTruthy();
      expect(component.getContactValidationError()).toBe('Please provide at least one contact method (email, phone, or mobile)');
    });

    it('should not have atLeastOneContact error when email is provided', () => {
      component.contactForm.patchValue({
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '',
        mobile: '',
        job_title: 'Manager',
        notes: 'Test notes'
      });

      expect(component.contactForm.errors?.['atLeastOneContact']).toBeFalsy();
      expect(component.hasContactValidationError()).toBeFalsy();
    });

    it('should not have atLeastOneContact error when phone is provided', () => {
      component.contactForm.patchValue({
        full_name: 'John Doe',
        email: '',
        phone: '(555) 123-4567',
        mobile: '',
        job_title: 'Manager',
        notes: 'Test notes'
      });

      expect(component.contactForm.errors?.['atLeastOneContact']).toBeFalsy();
      expect(component.hasContactValidationError()).toBeFalsy();
    });

    it('should not have atLeastOneContact error when mobile is provided', () => {
      component.contactForm.patchValue({
        full_name: 'John Doe',
        email: '',
        phone: '',
        mobile: '(555) 987-6543',
        job_title: 'Manager',
        notes: 'Test notes'
      });

      expect(component.contactForm.errors?.['atLeastOneContact']).toBeFalsy();
      expect(component.hasContactValidationError()).toBeFalsy();
    });
  });
});
