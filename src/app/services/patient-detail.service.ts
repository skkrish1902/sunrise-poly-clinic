import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Medicine {
  provider: string;
  drugName: string;
  quantity: number;
  timing: string;
  frequency: string;
}

export interface PatientDetail {
  id?: number;
  patientId: number;
  MedicalRecordId: string;
  dateAdded: string;
  problem: string;
  doctorComments: string;
  additionalAppointments: string;
  medicines: Medicine[];
}

@Injectable({
  providedIn: 'root'
})
export class PatientDetailService {
  private apiUrl = 'http://localhost:3000/api/patient-details';
  private patientDetailsSubject = new BehaviorSubject<PatientDetail[]>([]);
  public patientDetails$ = this.patientDetailsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadPatientDetails();
  }

  private loadPatientDetails(): void {
    this.http.get<PatientDetail[]>(this.apiUrl).subscribe(details => {
      this.patientDetailsSubject.next(details);
    });
  }

  private saveToServer(details: PatientDetail[]): Observable<any> {
    return this.http.post(this.apiUrl, details).pipe(
      tap(() => {
        this.patientDetailsSubject.next(details);
      })
    );
  }

  getPatientDetails(patientId: number): PatientDetail[] {
    const details = this.patientDetailsSubject.value;
    return details.filter(d => d.patientId === patientId);
  }

  getPatientDetail(patientId: number): PatientDetail | null {
    const details = this.patientDetailsSubject.value;
    return details.find(d => d.patientId === patientId) || null;
  }

  addPatientDetail(detail: PatientDetail): void {
    const currentDetails = this.patientDetailsSubject.value;
    const newId = currentDetails.length > 0 
      ? Math.max(...currentDetails.map(d => d.id || 0)) + 1 
      : 1;
    
    // Set today's date if not already set
    const today = new Date();
    const dateAdded = detail.dateAdded || `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    
    const newDetail = { ...detail, id: newId, dateAdded };
    const updatedDetails = [...currentDetails, newDetail];
    this.saveToServer(updatedDetails).subscribe();
  }

  updatePatientDetail(detail: PatientDetail): void {
    const currentDetails = this.patientDetailsSubject.value;
    const index = currentDetails.findIndex(d => d.id === detail.id);
    if (index !== -1) {
      currentDetails[index] = detail;
      this.saveToServer([...currentDetails]).subscribe();
    }
  }

  deletePatientDetail(id: number): void {
    const currentDetails = this.patientDetailsSubject.value;
    const updatedDetails = currentDetails.filter(d => d.id !== id);
    this.saveToServer(updatedDetails).subscribe();
  }

  savePatientDetail(detail: PatientDetail): void {
    const currentDetails = this.patientDetailsSubject.value;
    const existingIndex = currentDetails.findIndex(d => d.patientId === detail.patientId);
    
    if (existingIndex !== -1) {
      currentDetails[existingIndex] = detail;
      this.saveToServer([...currentDetails]).subscribe();
    } else {
      const newId = currentDetails.length > 0 
        ? Math.max(...currentDetails.map(d => d.id || 0)) + 1 
        : 1;
      const newDetail = { ...detail, id: newId };
      const updatedDetails = [...currentDetails, newDetail];
      this.saveToServer(updatedDetails).subscribe();
    }
  }
}
