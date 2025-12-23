import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as XLSX from 'xlsx';

export interface Patient {
  id?: number;
  MedicalRecordId: string;
  Name: string;
  Age: number;
  PhoneNumber: string;
  Address: string;
  LastVisit: string;
  AttendingDoctor: string;
  appointments?: Appointment[];
}

export interface Appointment {
  id?: number;
  AppointmentDate: string;
  AppointmentTime: string;
  AttendingDoctor: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:3000/api/patients';
  private patientsSubject = new BehaviorSubject<Patient[]>([]);
  public patients$ = this.patientsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadPatients();
  }

  private loadPatients(): void {
    this.http.get<Patient[]>(this.apiUrl).subscribe(patients => {
      this.patientsSubject.next(patients);
    });
  }

  private saveToServer(patients: Patient[]): Observable<any> {
    return this.http.post(this.apiUrl, patients).pipe(
      tap(() => {
        this.patientsSubject.next(patients);
      })
    );
  }

  getPatients(): Observable<Patient[]> {
    return this.patients$;
  }

  addPatient(patient: Patient): void {
    const currentPatients = this.patientsSubject.value;
    const newId = currentPatients.length > 0 
      ? Math.max(...currentPatients.map(p => p.id || 0)) + 1 
      : 1;
    
    // Generate MR ID if not provided
    const medicalRecordId = patient.MedicalRecordId || this.generateMedicalRecordId(currentPatients);
    
    const newPatient = { ...patient, id: newId, MedicalRecordId: medicalRecordId };
    const updatedPatients = [...currentPatients, newPatient];
    
    this.saveToServer(updatedPatients).subscribe();
  }

  private generateMedicalRecordId(patients: Patient[]): string {
    // Find the highest existing MR ID number
    let maxNum = 0;
    patients.forEach(p => {
      if (p.MedicalRecordId) {
        const num = parseInt(p.MedicalRecordId.replace('#', ''));
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    
    // Generate new ID with leading zeros (e.g., #001, #002)
    const newNum = maxNum + 1;
    return `#${String(newNum).padStart(3, '0')}`;
  }

  updatePatient(updatedPatient: Patient): void {
    const currentPatients = this.patientsSubject.value;
    const index = currentPatients.findIndex(p => p.id === updatedPatient.id);
    if (index !== -1) {
      currentPatients[index] = updatedPatient;
      this.saveToServer([...currentPatients]).subscribe();
    }
  }

  deletePatient(id: number): void {
    const currentPatients = this.patientsSubject.value;
    const updatedPatients = currentPatients.filter(p => p.id !== id);
    this.saveToServer(updatedPatients).subscribe();
  }

  exportToExcel(): void {
    const patients = this.patientsSubject.value.map(({ id, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(patients);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');
    XLSX.writeFile(workbook, 'patients.xlsx');
  }
}
