import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as XLSX from 'xlsx';

export interface Medicine {
  id?: number;
  Provider: string;
  DrugName: string;
  Quantity: number;
  TabsPerSheet: number;
  Available: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicineService {
  private apiUrl = 'http://localhost:3000/api/medicines';
  private medicinesSubject = new BehaviorSubject<Medicine[]>([]);
  public medicines$ = this.medicinesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadMedicines();
  }

  private loadMedicines(): void {
    this.http.get<Medicine[]>(this.apiUrl).subscribe(medicines => {
      this.medicinesSubject.next(medicines);
    });
  }

  private saveToServer(medicines: Medicine[]): Observable<any> {
    return this.http.post(this.apiUrl, medicines).pipe(
      tap(() => {
        this.medicinesSubject.next(medicines);
      })
    );
  }

  getMedicines(): Observable<Medicine[]> {
    return this.medicines$;
  }

  addMedicine(medicine: Medicine): void {
    const currentMedicines = this.medicinesSubject.value;
    const newId = currentMedicines.length > 0 
      ? Math.max(...currentMedicines.map(m => m.id || 0)) + 1 
      : 1;
    const newMedicine = { ...medicine, id: newId };
    const updatedMedicines = [...currentMedicines, newMedicine];
    
    this.saveToServer(updatedMedicines).subscribe();
  }

  updateMedicine(updatedMedicine: Medicine): void {
    const currentMedicines = this.medicinesSubject.value;
    const index = currentMedicines.findIndex(m => m.id === updatedMedicine.id);
    if (index !== -1) {
      currentMedicines[index] = updatedMedicine;
      this.saveToServer([...currentMedicines]).subscribe();
    }
  }

  deleteMedicine(id: number): void {
    const currentMedicines = this.medicinesSubject.value;
    const updatedMedicines = currentMedicines.filter(m => m.id !== id);
    this.saveToServer(updatedMedicines).subscribe();
  }

  exportToExcel(): void {
    const medicines = this.medicinesSubject.value.map(({ id, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(medicines);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicines');
    XLSX.writeFile(workbook, 'medicines.xlsx');
  }
}
