import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService, Patient } from '../services/patient.service';
import { PatientDetailService, PatientDetail, Medicine } from '../services/patient-detail.service';
import { MedicineService, Medicine as MedicineInventory } from '../services/medicine.service';

@Component({
  selector: 'app-patient-detail',
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.css']
})
export class PatientDetailComponent implements OnInit {
  patientId: number = 0;
  patient: Patient | null = null;
  patientDetails: PatientDetail[] = [];
  editingDetail: PatientDetail | null = null;
  originalMedicines: Medicine[] = [];
  
  patientDetail: PatientDetail = {
    patientId: 0,
    MedicalRecordId: '',
    dateAdded: '',
    problem: '',
    doctorComments: '',
    additionalAppointments: '',
    medicines: []
  };

  // Medicine data from inventory
  medicineInventory: MedicineInventory[] = [];
  providers: string[] = [];
  drugNames: string[] = [];
  filteredDrugNames: { [key: number]: string[] } = {};
  timingOptions: string[] = ['After Food', 'Before Food'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private patientDetailService: PatientDetailService,
    private medicineService: MedicineService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.patientId = +params['id'];
      this.loadPatient();
      this.loadPatientDetails();
      this.loadMedicines();
    });
  }

  loadPatient(): void {
    this.patientService.getPatients().subscribe(patients => {
      this.patient = patients.find(p => p.id === this.patientId) || null;
    });
  }

  loadPatientDetails(): void {
    this.patientDetailService.patientDetails$.subscribe(details => {
      this.patientDetails = details.filter(d => d.patientId === this.patientId);
    });
    this.resetForm();
  }

  loadMedicines(): void {
    this.medicineService.getMedicines().subscribe(medicines => {
      this.medicineInventory = medicines;
      // Extract unique providers and drug names
      this.providers = [...new Set(medicines.map(m => m.Provider))].sort();
      this.drugNames = [...new Set(medicines.map(m => m.DrugName))].sort();
    });
  }

  resetForm(): void {
    this.editingDetail = null;
    this.originalMedicines = [];
    const today = new Date();
    const dateAdded = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    
    this.patientDetail = {
      patientId: this.patientId,
      MedicalRecordId: this.patient?.MedicalRecordId || '',
      dateAdded: dateAdded,
      problem: '',
      doctorComments: '',
      additionalAppointments: '',
      medicines: []
    };
  }

  addMedicine(): void {
    const newIndex = this.patientDetail.medicines.length;
    this.patientDetail.medicines.push({
      provider: '',
      drugName: '',
      quantity: 0,
      timing: '',
      frequency: ''
    });
    // Initialize filtered drug names for this medicine
    this.filteredDrugNames[newIndex] = [...this.drugNames];
  }

  removeMedicine(index: number): void {
    this.patientDetail.medicines.splice(index, 1);
    // Rebuild filtered drug names mapping after removal
    const newFilteredDrugNames: { [key: number]: string[] } = {};
    this.patientDetail.medicines.forEach((_, i) => {
      if (this.filteredDrugNames[i >= index ? i + 1 : i]) {
        newFilteredDrugNames[i] = this.filteredDrugNames[i >= index ? i + 1 : i];
      } else {
        newFilteredDrugNames[i] = [...this.drugNames];
      }
    });
    this.filteredDrugNames = newFilteredDrugNames;
  }

  saveDetails(): void {
    // If editing, restore old medicine quantities first
    if (this.editingDetail && this.originalMedicines.length > 0) {
      this.restoreMedicineQuantities(this.originalMedicines);
    }
    
    // Validate that all medicine quantities are available
    const validationError = this.validateMedicineQuantities();
    if (validationError) {
      alert(validationError);
      // Restore quantities if validation fails during edit
      if (this.editingDetail && this.originalMedicines.length > 0) {
        this.deductMedicineQuantities(this.originalMedicines);
      }
      return;
    }
    
    // Deduct medicine quantities from inventory
    this.deductMedicineQuantities(this.patientDetail.medicines);
    
    if (this.editingDetail) {
      // Update existing detail
      this.patientDetailService.updatePatientDetail({
        ...this.patientDetail,
        id: this.editingDetail.id
      });
    } else {
      // Add new detail
      this.patientDetailService.addPatientDetail(this.patientDetail);
    }
    this.resetForm();
  }

  editDetail(detail: PatientDetail): void {
    this.editingDetail = detail;
    this.patientDetail = {
      ...detail,
      medicines: [...detail.medicines.map(m => ({ ...m }))]
    };
    
    // Store original medicines to restore quantities if needed
    this.originalMedicines = detail.medicines.map(m => ({ ...m }));
    
    // Initialize filtered drug names for each medicine
    this.patientDetail.medicines.forEach((medicine, index) => {
      if (medicine.provider) {
        this.onProviderChangeMedicine(index);
      } else {
        this.filteredDrugNames[index] = [...this.drugNames];
      }
    });
    // Scroll to form
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  deleteDetail(detail: PatientDetail): void {
    if (confirm('Are you sure you want to delete this record?')) {
      if (detail.id) {
        this.patientDetailService.deletePatientDetail(detail.id);
      }
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  goBack(): void {
    this.router.navigate(['/patients']);
  }

  areMedicinesValid(): boolean {
    // Check if all medicines have all fields filled
    return this.patientDetail.medicines.every(med => 
      med.provider && med.provider.trim() !== '' &&
      med.drugName && med.drugName.trim() !== '' &&
      med.quantity > 0 &&
      med.timing && med.timing.trim() !== '' &&
      med.frequency && med.frequency.trim() !== ''
    );
  }

  getSubmitButtonTitle(isFormValid: boolean): string {
    if (!isFormValid) {
      return 'Please fill all required fields (Problem and Doctor Comments)';
    }
    if (this.patientDetail.medicines.length === 0) {
      return 'Please add at least one medicine';
    }
    if (!this.areMedicinesValid()) {
      return 'Please fill all medicine fields (Name, Dosage, and Frequency)';
    }
    return '';
  }

  getMedicineAvailability(drugName: string): string {
    const medicine = this.medicineInventory.find(m => m.DrugName === drugName);
    return medicine ? medicine.Available : '';
  }

  getAvailableQuantity(drugName: string): number {
    const medicine = this.medicineInventory.find(m => m.DrugName === drugName);
    return medicine ? medicine.Quantity : 0;
  }

  isQuantityAvailable(drugName: string, requestedQuantity: number): boolean {
    const availableQuantity = this.getAvailableQuantity(drugName);
    return requestedQuantity <= availableQuantity;
  }

  onProviderChangeMedicine(index: number): void {
    const medicine = this.patientDetail.medicines[index];
    if (medicine.provider) {
      // Filter drug names that belong to the selected provider
      const providerMedicines = this.medicineInventory.filter(m => m.Provider === medicine.provider);
      const providerDrugNames = [...new Set(providerMedicines.map(m => m.DrugName))];
      this.filteredDrugNames[index] = providerDrugNames.sort();
      
      // Clear drug name if it doesn't belong to the selected provider
      if (medicine.drugName && !this.filteredDrugNames[index].includes(medicine.drugName)) {
        medicine.drugName = '';
      }
    } else {
      // Show all drug names if no provider selected
      this.filteredDrugNames[index] = [...this.drugNames];
    }
  }

  validateMedicineQuantities(): string | null {
    for (const medicine of this.patientDetail.medicines) {
      if (!medicine.drugName || medicine.quantity <= 0) {
        continue;
      }
      
      const inventoryMedicine = this.medicineInventory.find(
        m => m.Provider === medicine.provider && m.DrugName === medicine.drugName
      );
      
      if (!inventoryMedicine) {
        return `Medicine "${medicine.drugName}" from provider "${medicine.provider}" not found in inventory.`;
      }
      
      if (inventoryMedicine.Available !== 'Yes') {
        return `Medicine "${medicine.drugName}" is not available in inventory.`;
      }
      
      if (inventoryMedicine.Quantity < medicine.quantity) {
        return `Insufficient quantity for "${medicine.drugName}". Available: ${inventoryMedicine.Quantity}, Required: ${medicine.quantity}`;
      }
    }
    return null;
  }

  deductMedicineQuantities(medicines: Medicine[]): void {
    medicines.forEach(medicine => {
      if (!medicine.drugName || medicine.quantity <= 0) {
        return;
      }
      
      const inventoryMedicine = this.medicineInventory.find(
        m => m.Provider === medicine.provider && m.DrugName === medicine.drugName
      );
      
      if (inventoryMedicine) {
        inventoryMedicine.Quantity -= medicine.quantity;
        
        // Update availability status if quantity reaches zero
        if (inventoryMedicine.Quantity <= 0) {
          inventoryMedicine.Available = 'No';
        }
        
        this.medicineService.updateMedicine(inventoryMedicine);
      }
    });
  }

  restoreMedicineQuantities(medicines: Medicine[]): void {
    medicines.forEach(medicine => {
      if (!medicine.drugName || medicine.quantity <= 0) {
        return;
      }
      
      const inventoryMedicine = this.medicineInventory.find(
        m => m.Provider === medicine.provider && m.DrugName === medicine.drugName
      );
      
      if (inventoryMedicine) {
        inventoryMedicine.Quantity += medicine.quantity;
        
        // Update availability status
        if (inventoryMedicine.Quantity > 0) {
          inventoryMedicine.Available = 'Yes';
        }
        
        this.medicineService.updateMedicine(inventoryMedicine);
      }
    });
  }

  printDetail(detail: PatientDetail): void {
    // Store the detail to print
    const printContent = this.generatePrintContent(detail);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  private generatePrintContent(detail: PatientDetail): string {
    const medicinesHtml = detail.medicines.map(med => 
      `<tr>
        <td>${med.provider}</td>
        <td>${med.drugName}</td>
        <td>${med.quantity}</td>
        <td>${med.timing}</td>
        <td>${med.frequency}</td>
      </tr>`
    ).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Record - ${this.patient?.Name}</title>
        <style>
          @page {
            margin: 0.5in;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .print-header {
            text-align: center;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
            min-height: 80px;
          }
          .clinic-name {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
          }
          .clinic-subtitle {
            font-size: 14px;
            color: #666;
          }
          .patient-info {
            background: #f8f9ff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .patient-info h2 {
            margin: 0 0 15px 0;
            color: #667eea;
            font-size: 20px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .info-item {
            display: flex;
            gap: 10px;
          }
          .info-item .label {
            font-weight: 600;
            min-width: 140px;
          }
          .record-section {
            margin-bottom: 20px;
          }
          .record-section h3 {
            background: #667eea;
            color: white;
            padding: 10px;
            margin: 0 0 15px 0;
            font-size: 16px;
          }
          .field {
            margin-bottom: 15px;
          }
          .field-label {
            font-weight: 600;
            margin-bottom: 5px;
            color: #555;
          }
          .field-value {
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
            white-space: pre-wrap;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          table th {
            background: #667eea;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 14px;
          }
          table td {
            padding: 8px 10px;
            border-bottom: 1px solid #ddd;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="clinic-name">Sunrise Poly Clinic</div>
          <div class="clinic-subtitle">Healthcare Management System</div>
        </div>

        <div class="patient-info">
          <h2>${this.patient?.Name} - ${this.patient?.MedicalRecordId}</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Age:</span>
              <span class="value">${this.patient?.Age} years</span>
            </div>
            <div class="info-item">
              <span class="label">Phone Number:</span>
              <span class="value">${this.patient?.PhoneNumber}</span>
            </div>
            <div class="info-item">
              <span class="label">Address:</span>
              <span class="value">${this.patient?.Address}</span>
            </div>
            <div class="info-item">
              <span class="label">Last Visit:</span>
              <span class="value">${this.patient?.LastVisit}</span>
            </div>
            <div class="info-item">
              <span class="label">Attending Doctor:</span>
              <span class="value">${this.patient?.AttendingDoctor}</span>
            </div>
            <div class="info-item">
              <span class="label">Record Date:</span>
              <span class="value">${detail.dateAdded}</span>
            </div>
          </div>
        </div>

        <div class="record-section">
          <h3>Problem</h3>
          <div class="field-value">${detail.problem}</div>
        </div>

        <div class="record-section">
          <h3>Doctor Comments</h3>
          <div class="field-value">${detail.doctorComments}</div>
        </div>

        <div class="record-section">
          <h3>Additional Appointments</h3>
          <div class="field-value">${detail.additionalAppointments || 'None'}</div>
        </div>

        ${detail.medicines.length > 0 ? `
        <div class="record-section">
          <h3>Prescribed Medicines</h3>
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Drug Name</th>
                <th>Quantity</th>
                <th>Timing</th>
                <th>Frequency</th>
              </tr>
            </thead>
            <tbody>
              ${medicinesHtml}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <p>Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>This is a computer-generated document. Signature not required.</p>
        </div>
      </body>
      </html>
    `;
  }
}
