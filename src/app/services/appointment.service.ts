import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as XLSX from 'xlsx';

export interface Appointment {
  id?: number;
  MedicalRecordId: string;
  PatientName: string;
  Age: number;
  Address: string;
  AppointmentDate: string;
  AppointmentTime: string;
  AttendingDoctor: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:3000/api/appointments';
  private appointmentsSubject = new BehaviorSubject<Appointment[]>([]);
  public appointments$ = this.appointmentsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadAppointments();
  }

  private loadAppointments(): void {
    this.http.get<Appointment[]>(this.apiUrl).subscribe(appointments => {
      this.appointmentsSubject.next(appointments);
    });
  }

  private saveToServer(appointments: Appointment[]): Observable<any> {
    return this.http.post(this.apiUrl, appointments).pipe(
      tap(() => {
        this.appointmentsSubject.next(appointments);
      })
    );
  }

  getAppointments(): Observable<Appointment[]> {
    return this.appointments$;
  }

  addAppointment(appointment: Appointment): void {
    const currentAppointments = this.appointmentsSubject.value;
    const newId = currentAppointments.length > 0 
      ? Math.max(...currentAppointments.map(a => a.id || 0)) + 1 
      : 1;
    const newAppointment = { ...appointment, id: newId };
    const updatedAppointments = [...currentAppointments, newAppointment];
    
    this.saveToServer(updatedAppointments).subscribe();
  }

  updateAppointment(updatedAppointment: Appointment): void {
    const currentAppointments = this.appointmentsSubject.value;
    const index = currentAppointments.findIndex(a => a.id === updatedAppointment.id);
    if (index !== -1) {
      currentAppointments[index] = updatedAppointment;
      this.saveToServer([...currentAppointments]).subscribe();
    }
  }

  deleteAppointment(id: number): void {
    const currentAppointments = this.appointmentsSubject.value;
    const updatedAppointments = currentAppointments.filter(a => a.id !== id);
    this.saveToServer(updatedAppointments).subscribe();
  }

  exportToExcel(): void {
    const appointments = this.appointmentsSubject.value.map(({ id, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(appointments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments');
    XLSX.writeFile(workbook, 'appointments.xlsx');
  }
}
