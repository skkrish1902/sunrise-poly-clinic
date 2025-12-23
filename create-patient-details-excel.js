const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Create patient-details.xlsx with sample data
const today = new Date();
const dateAdded = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

const patientDetails = [
  {
    patientId: 1,
    MedicalRecordId: '#001',
    dateAdded: dateAdded,
    problem: 'Fever and cold',
    doctorComments: 'Patient has mild viral infection. Advised rest and medication.',
    additionalAppointments: 'Follow-up after 7 days',
    medicines: JSON.stringify([
      { name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily' },
      { name: 'Vitamin C', dosage: '100mg', frequency: 'Once daily' }
    ])
  }
];

const assetsDir = path.join(__dirname, 'src', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create workbook and worksheet
const worksheet = XLSX.utils.json_to_sheet(patientDetails);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'PatientDetails');

// Write to file
const filePath = path.join(assetsDir, 'patient-details.xlsx');
XLSX.writeFile(workbook, filePath);

console.log('patient-details.xlsx created successfully with sample data!');
console.log(`File location: ${filePath}`);
