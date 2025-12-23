import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService, Patient, Appointment } from '../services/patient.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit {
  patients: Patient[] = [];
  appointments: any[] = [];
  filteredAppointments: any[] = [];
  displayedAppointments: any[] = [];
  todayAppointments: any[] = [];
  futureAppointments: any[] = [];
  oldAppointments: any[] = [];
  allDoctors: string[] = [];
  selectedDoctor: string = '';
  showOldAppointments: boolean = false;
  loading: boolean = true;
  showForm: boolean = false;
  editingAppointment: any | null = null;
  selectedPatient: Patient | null = null;
  
  // Search functionality
  searchTerm: string = '';
  searchResults: Patient[] = [];
  showSearchDropdown: boolean = false;
  selectedSearchPatient: Patient | null = null;
  
  // Modal search functionality
  modalSearchTerm: string = '';
  filteredModalPatients: Patient[] = [];
  showModalDropdown: boolean = false;
  
  formData: any = {
    patientId: 0,
    MedicalRecordId: '',
    PatientName: '',
    Age: 0,
    PhoneNumber: '',
    Address: '',
    AppointmentDate: '',
    AppointmentTime: '',
    AttendingDoctor: ''
  };

  constructor(
    private patientService: PatientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.appointments = this.extractAppointments(patients);
        this.filteredAppointments = [...this.appointments];
        this.extractDoctors();
        this.categorizeAppointments();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.loading = false;
      }
    });
  }

  extractAppointments(patients: Patient[]): any[] {
    const allAppointments: any[] = [];
    patients.forEach(patient => {
      if (patient.appointments && patient.appointments.length > 0) {
        patient.appointments.forEach((apt, index) => {
          allAppointments.push({
            id: apt.id,
            patientId: patient.id,
            MedicalRecordId: patient.MedicalRecordId,
            PatientName: patient.Name,
            Age: patient.Age,
            PhoneNumber: patient.PhoneNumber,
            Address: patient.Address,
            AppointmentDate: apt.AppointmentDate,
            AppointmentTime: apt.AppointmentTime,
            AttendingDoctor: apt.AttendingDoctor
          });
        });
      }
    });
    return allAppointments;
  }

  categorizeAppointments(): void {
    const today = this.getCurrentDateString();
    
    this.todayAppointments = this.filteredAppointments.filter(a => a.AppointmentDate === today);
    this.futureAppointments = this.filteredAppointments.filter(a => this.isDateAfter(a.AppointmentDate, today));
    this.oldAppointments = this.filteredAppointments.filter(a => this.isDateBefore(a.AppointmentDate, today));
    
    this.updateDisplayedAppointments();
  }

  updateDisplayedAppointments(): void {
    this.displayedAppointments = [
      ...this.todayAppointments,
      ...this.futureAppointments
    ];
    
    if (this.showOldAppointments) {
      this.displayedAppointments = [...this.displayedAppointments, ...this.oldAppointments];
    }
  }

  getCurrentDateString(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }

  isDateAfter(dateStr: string, compareStr: string): boolean {
    const date = this.parseDate(dateStr);
    const compareDate = this.parseDate(compareStr);
    return date > compareDate;
  }

  isDateBefore(dateStr: string, compareStr: string): boolean {
    const date = this.parseDate(dateStr);
    const compareDate = this.parseDate(compareStr);
    return date < compareDate;
  }

  parseDate(dateStr: string): Date {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date();
  }

  toggleOldAppointments(): void {
    this.showOldAppointments = !this.showOldAppointments;
    this.updateDisplayedAppointments();
  }

  extractDoctors(): void {
    const doctorSet = new Set(this.appointments.map(a => a.AttendingDoctor).filter(d => d));
    this.allDoctors = Array.from(doctorSet).sort();
  }

  filterByDoctor(): void {
    this.applyFilters();
  }

  getBaseFilteredAppointments(): any[] {
    if (this.selectedSearchPatient) {
      return this.appointments.filter(a => a.PatientName === this.selectedSearchPatient!.Name);
    }
    return this.appointments;
  }

  applyFilters(): void {
    let result = this.getBaseFilteredAppointments();
    
    if (this.selectedDoctor !== '') {
      result = result.filter(a => a.AttendingDoctor === this.selectedDoctor);
    }
    
    this.filteredAppointments = result;
    this.categorizeAppointments();
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

  openAddForm(): void {
    this.editingAppointment = null;
    this.selectedPatient = null;
    this.modalSearchTerm = '';
    this.filteredModalPatients = this.patients;
    this.showModalDropdown = false;
    this.formData = {
      patientId: 0,
      MedicalRecordId: '',
      PatientName: '',
      Age: 0,
      PhoneNumber: '',
      Address: '',
      AppointmentDate: '',
      AppointmentTime: '',
      AttendingDoctor: ''
    };
    this.showForm = true;
  }

  onModalSearchInput(): void {
    this.showModalDropdown = true;
    if (this.modalSearchTerm.trim() === '') {
      this.filteredModalPatients = this.patients;
    } else {
      this.filteredModalPatients = this.patients.filter(p => 
        p.Name.toLowerCase().includes(this.modalSearchTerm.toLowerCase()) ||
        p.MedicalRecordId.toLowerCase().includes(this.modalSearchTerm.toLowerCase())
      );
    }
  }

  selectModalPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.modalSearchTerm = `${patient.MedicalRecordId} - ${patient.Name}`;
    this.showModalDropdown = false;
    this.formData = {
      patientId: patient.id,
      MedicalRecordId: patient.MedicalRecordId,
      PatientName: patient.Name,
      Age: patient.Age,
      PhoneNumber: patient.PhoneNumber,
      Address: patient.Address,
      AppointmentDate: '',
      AppointmentTime: '',
      AttendingDoctor: patient.AttendingDoctor
    };
  }

  clearModalSearch(): void {
    this.modalSearchTerm = '';
    this.filteredModalPatients = this.patients;
    this.showModalDropdown = false;
    this.selectedPatient = null;
    this.formData = {
      patientId: 0,
      MedicalRecordId: '',
      PatientName: '',
      Age: 0,
      PhoneNumber: '',
      Address: '',
      AppointmentDate: '',
      AppointmentTime: '',
      AttendingDoctor: ''
    };
  }

  onPatientSelect(event: any): void {
    const medicalRecordId = event.target.value;
    this.selectedPatient = this.patients.find(p => p.MedicalRecordId === medicalRecordId) || null;
    if (this.selectedPatient) {
      this.formData.patientId = this.selectedPatient.id;
      this.formData.MedicalRecordId = this.selectedPatient.MedicalRecordId;
      this.formData.PatientName = this.selectedPatient.Name;
      this.formData.Age = this.selectedPatient.Age;
      this.formData.Address = this.selectedPatient.Address;
    }
  }

  openEditForm(appointment: any): void {
    this.editingAppointment = appointment;
    this.selectedPatient = this.patients.find(p => p.id === appointment.patientId) || null;
    this.formData = { ...appointment };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingAppointment = null;
  }

  saveAppointment(): void {
    if (this.editingAppointment) {
      // Update existing appointment
      const patient = this.patients.find(p => p.id === this.formData.patientId);
      if (patient && patient.appointments) {
        // Update patient phone number if changed
        patient.PhoneNumber = this.formData.PhoneNumber;
        
        const aptIndex = patient.appointments.findIndex(a => a.id === this.editingAppointment.id);
        if (aptIndex !== -1) {
          patient.appointments[aptIndex] = {
            id: this.editingAppointment.id,
            AppointmentDate: this.formData.AppointmentDate,
            AppointmentTime: this.formData.AppointmentTime,
            AttendingDoctor: this.formData.AttendingDoctor
          };
          this.patientService.updatePatient(patient);
        }
      }
    } else {
      // Add new appointment
      const patient = this.patients.find(p => p.id === this.formData.patientId);
      if (patient) {
        // Update patient phone number if changed
        patient.PhoneNumber = this.formData.PhoneNumber;
        
        if (!patient.appointments) {
          patient.appointments = [];
        }
        const newId = patient.appointments.length > 0 
          ? Math.max(...patient.appointments.map(a => a.id || 0)) + 1 
          : 1;
        patient.appointments.push({
          id: newId,
          AppointmentDate: this.formData.AppointmentDate,
          AppointmentTime: this.formData.AppointmentTime,
          AttendingDoctor: this.formData.AttendingDoctor
        });
        this.patientService.updatePatient(patient);
      }
    }
    this.closeForm();
    setTimeout(() => this.loadAppointments(), 500);
  }

  deleteAppointment(appointment: any): void {
    if (confirm(`Are you sure you want to delete appointment for ${appointment.PatientName}?`)) {
      const patient = this.patients.find(p => p.id === appointment.patientId);
      if (patient && patient.appointments) {
        patient.appointments = patient.appointments.filter(a => a.id !== appointment.id);
        this.patientService.updatePatient(patient);
        setTimeout(() => this.loadAppointments(), 500);
      }
    }
  }

  exportToExcel(): void {
    // Export appointments data
    const worksheet = XLSX.utils.json_to_sheet(this.appointments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments');
    XLSX.writeFile(workbook, 'appointments.xlsx');
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
      this.formData.AppointmentDate = `${day}/${month}/${year}`;
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  // Convert 24-hour time to 12-hour format with AM/PM
  convertTo12HourFormat(time24: string): string {
    if (!time24) return '';
    
    const [hours24, minutes] = time24.split(':');
    let hours = parseInt(hours24);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    return `${hours}:${minutes} ${ampm}`;
  }
}
