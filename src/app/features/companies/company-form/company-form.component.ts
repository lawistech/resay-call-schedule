// src/app/features/companies/company-form/company-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from '../services/company.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Company } from '../../../core/models/company.model';

@Component({
  selector: 'app-company-form',
  templateUrl: './company-form.component.html',
  styleUrls: ['./company-form.component.scss']
})
export class CompanyFormComponent implements OnInit {
  companyForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  companyId: string | null = null;
  isEditMode = false;

  // Industry options
  industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Hospitality',
    'Construction',
    'Transportation',
    'Energy',
    'Agriculture',
    'Entertainment',
    'Other'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private companyService: CompanyService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.companyId = this.route.snapshot.paramMap.get('id');
    
    if (this.companyId) {
      this.isEditMode = true;
      this.loadCompany(this.companyId);
    }
  }

  initForm(): void {
    this.companyForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      industry: [''],
      website: [''],
      address: [''],
      notes: ['']
    });
  }

  loadCompany(id: string): void {
    this.isLoading = true;
    this.companyService.getCompanyById(id).subscribe({
      next: (company) => {
        this.companyForm.patchValue({
          name: company.name,
          industry: company.industry,
          website: company.website,
          address: company.address,
          notes: company.notes
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Failed to load company details');
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.companyForm.invalid) {
      this.markFormGroupTouched(this.companyForm);
      return;
    }

    this.isSubmitting = true;
    const companyData = this.companyForm.value;

    if (this.isEditMode && this.companyId) {
      this.companyService.updateCompany(this.companyId, companyData).subscribe({
        next: (company) => {
          this.notificationService.success('Company updated successfully');
          this.router.navigate(['/companies', company.id]);
          this.isSubmitting = false;
        },
        error: (error) => {
          this.notificationService.error('Failed to update company');
          this.isSubmitting = false;
        }
      });
    } else {
      this.companyService.createCompany(companyData).subscribe({
        next: (company) => {
          this.notificationService.success('Company created successfully');
          this.router.navigate(['/companies', company.id]);
          this.isSubmitting = false;
        },
        error: (error) => {
          this.notificationService.error('Failed to create company');
          this.isSubmitting = false;
        }
      });
    }
  }

  cancel(): void {
    if (this.isEditMode && this.companyId) {
      this.router.navigate(['/companies', this.companyId]);
    } else {
      this.router.navigate(['/companies']);
    }
  }

  // Helper method to mark all form controls as touched
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
