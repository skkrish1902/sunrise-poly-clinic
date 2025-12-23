import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MedicineService, Medicine } from '../services/medicine.service';

@Component({
  selector: 'app-medicines',
  templateUrl: './medicines.component.html',
  styleUrls: ['./medicines.component.css']
})
export class MedicinesComponent implements OnInit {
  medicines: Medicine[] = [];
  loading: boolean = true;
  showForm: boolean = false;
  editingMedicine: Medicine | null = null;
  
  formData: Medicine = {
    Provider: '',
    DrugName: '',
    Quantity: 0,
    TabsPerSheet: 0,
    Available: 'Yes'
  };

  // Dropdown options
  providers: string[] = ['Apollo Pharmacy', 'MedPlus', 'NetMeds', 'PharmEasy', 'Local Distributor'];
  drugNames: string[] = [
    'Paracetamol',
    'Ibuprofen',
    'Amoxicillin',
    'Azithromycin',
    'Metformin',
    'Aspirin',
    'Omeprazole',
    'Atorvastatin',
    'Amlodipine',
    'Cetirizine'
  ];
  filteredDrugNames: string[] = [];

  constructor(
    private medicineService: MedicineService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMedicines();
  }

  loadMedicines(): void {
    this.medicineService.getMedicines().subscribe({
      next: (data) => {
        this.medicines = data;
        this.loading = false;
        
        // Extract unique providers and drug names from existing medicines
        const existingProviders = [...new Set(data.map(m => m.Provider).filter(p => p))];
        const existingDrugNames = [...new Set(data.map(m => m.DrugName).filter(d => d))];
        
        // Merge with predefined lists and remove duplicates
        this.providers = [...new Set([...this.providers, ...existingProviders])].sort();
        this.drugNames = [...new Set([...this.drugNames, ...existingDrugNames])].sort();
        this.filteredDrugNames = [...this.drugNames];
      },
      error: (error) => {
        console.error('Error loading medicines:', error);
        this.loading = false;
      }
    });
  }

  openAddForm(): void {
    this.editingMedicine = null;
    this.formData = {
      Provider: '',
      DrugName: '',
      Quantity: 0,
      TabsPerSheet: 0,
      Available: 'Yes'
    };
    this.filteredDrugNames = [...this.drugNames];
    this.showForm = true;
  }

  openEditForm(medicine: Medicine): void {
    this.editingMedicine = medicine;
    this.formData = { ...medicine };
    this.onProviderChange();
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingMedicine = null;
  }

  onProviderChange(): void {
    if (this.formData.Provider) {
      // Filter drug names that belong to the selected provider
      const providerMedicines = this.medicines.filter(m => m.Provider === this.formData.Provider);
      const providerDrugNames = [...new Set(providerMedicines.map(m => m.DrugName))];
      this.filteredDrugNames = providerDrugNames.sort();
      
      // Clear drug name if it doesn't belong to the selected provider
      if (this.formData.DrugName && !this.filteredDrugNames.includes(this.formData.DrugName)) {
        this.formData.DrugName = '';
      }
    } else {
      // Show all drug names if no provider selected
      this.filteredDrugNames = [...this.drugNames];
    }
  }

  saveMedicine(): void {
    // Add new provider to list if it doesn't exist
    if (this.formData.Provider && !this.providers.includes(this.formData.Provider)) {
      this.providers.push(this.formData.Provider);
      this.providers.sort();
    }
    
    // Add new drug name to list if it doesn't exist
    if (this.formData.DrugName && !this.drugNames.includes(this.formData.DrugName)) {
      this.drugNames.push(this.formData.DrugName);
      this.drugNames.sort();
    }
    
    if (this.editingMedicine) {
      this.medicineService.updateMedicine({ ...this.formData, id: this.editingMedicine.id });
    } else {
      this.medicineService.addMedicine(this.formData);
    }
    this.closeForm();
  }

  deleteMedicine(medicine: Medicine): void {
    if (confirm(`Are you sure you want to delete ${medicine.DrugName}?`)) {
      this.medicineService.deleteMedicine(medicine.id!);
    }
  }

  exportToExcel(): void {
    this.medicineService.exportToExcel();
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
