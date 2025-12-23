import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService, Patient } from '../services/patient.service';

@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.css']
})
export class PatientsComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  allDoctors: string[] = [];
  selectedDoctor: string = '';
  loading: boolean = true;
  showForm: boolean = false;
  editingPatient: Patient | null = null;
  
  // Search functionality
  searchTerm: string = '';
  searchResults: Patient[] = [];
  showSearchDropdown: boolean = false;
  selectedSearchPatient: Patient | null = null;
  
  formData: Patient = {
    MedicalRecordId: '',
    Name: '',
    Age: 0,
    PhoneNumber: '',
    Address: '',
    LastVisit: '',
    AttendingDoctor: ''
  };

  constructor(
    private patientService: PatientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.patientService.getPatients().subscribe({
      next: (data) => {
        this.patients = data;
        this.filteredPatients = data;
        this.extractDoctors();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.loading = false;
      }
    });
  }

  extractDoctors(): void {
    const doctorSet = new Set(this.patients.map(p => p.AttendingDoctor).filter(d => d));
    this.allDoctors = Array.from(doctorSet).sort();
  }

  filterByDoctor(): void {
    if (this.selectedDoctor === '') {
      this.filteredPatients = this.getBaseFilteredPatients();
    } else {
      const baseFiltered = this.getBaseFilteredPatients();
      this.filteredPatients = baseFiltered.filter(p => p.AttendingDoctor === this.selectedDoctor);
    }
  }

  getBaseFilteredPatients(): Patient[] {
    if (this.selectedSearchPatient) {
      return [this.selectedSearchPatient];
    }
    return this.patients;
  }

  onSearchInput(): void {
    // Reset selected patient when user starts typing again
    this.selectedSearchPatient = null;
    
    if (this.searchTerm.length >= 2) {
      this.searchResults = this.patients.filter(p => 
        p.Name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      this.showSearchDropdown = this.searchResults.length > 0;
      this.applyFilters();
    } else {
      this.searchResults = [];
      this.showSearchDropdown = false;
      this.applyFilters();
    }
  }

  selectSearchResult(patient: Patient): void {
    this.selectedSearchPatient = patient;
    this.searchTerm = patient.Name;
    this.showSearchDropdown = false;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.showSearchDropdown = false;
    this.selectedSearchPatient = null;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = this.getBaseFilteredPatients();
    
    if (this.selectedDoctor !== '') {
      result = result.filter(p => p.AttendingDoctor === this.selectedDoctor);
    }
    
    this.filteredPatients = result;
  }

  openAddForm(): void {
    this.editingPatient = null;
    this.formData = {
      MedicalRecordId: '',
      Name: '',
      Age: 0,
      PhoneNumber: '',
      Address: '',
      LastVisit: this.getCurrentDate(),
      AttendingDoctor: ''
    };
    this.showForm = true;
  }

  openEditForm(patient: Patient): void {
    this.editingPatient = patient;
    this.formData = { ...patient };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingPatient = null;
  }

  savePatient(): void {
    if (this.editingPatient) {
      this.patientService.updatePatient({ ...this.formData, id: this.editingPatient.id });
    } else {
      this.patientService.addPatient(this.formData);
    }
    this.closeForm();
  }

  deletePatient(patient: Patient): void {
    if (confirm(`Are you sure you want to delete ${patient.Name}?`)) {
      this.patientService.deletePatient(patient.id!);
    }
  }

  exportToExcel(): void {
    this.patientService.exportToExcel();
  }

  getCurrentDate(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Convert DD/MM/YYYY to YYYY-MM-DD for date input
  dateToISO(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  }

  // Convert YYYY-MM-DD to DD/MM/YYYY for storage
  onDateChange(event: any): void {
    const isoDate = event.target.value;
    if (isoDate) {
      const date = new Date(isoDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      this.formData.LastVisit = `${day}/${month}/${year}`;
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  viewPatientDetail(patient: Patient): void {
    this.router.navigate(['/patient-detail', patient.id]);
  }
}
