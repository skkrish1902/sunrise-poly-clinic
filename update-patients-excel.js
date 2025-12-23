const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Create patients.xlsx with MR ID
const patients = [
  {
    MedicalRecordId: '#001',
    Name: 'Rajesh Kumar',
    Age: 45,
    PhoneNumber: '+91 98765 43210',
    Address: '123 Main Street, Hyderabad',
    LastVisit: '15/12/2025',
    AttendingDoctor: 'Siva',
    appointments: JSON.stringify([
      {
        id: 1,
        AppointmentDate: '18/12/2025',
        AppointmentTime: '10:00',
        AttendingDoctor: 'Siva'
      },
      {
        id: 2,
        AppointmentDate: '25/12/2025',
        AppointmentTime: '14:30',
        AttendingDoctor: 'Siva'
      }
    ])
  },
  {
    MedicalRecordId: '#002',
    Name: 'Priya Sharma',
    Age: 32,
    PhoneNumber: '+91 98765 43211',
    Address: '456 Park Avenue, Hyderabad',
    LastVisit: '16/12/2025',
    AttendingDoctor: 'Mahalakshmi',
    appointments: JSON.stringify([
      {
        id: 1,
        AppointmentDate: '19/12/2025',
        AppointmentTime: '11:00',
        AttendingDoctor: 'Mahalakshmi'
      }
    ])
  },
  {
    MedicalRecordId: '#003',
    Name: 'Suresh Reddy',
    Age: 58,
    PhoneNumber: '+91 98765 43212',
    Address: '789 Lake View, Hyderabad',
    LastVisit: '14/12/2025',
    AttendingDoctor: 'Siva',
    appointments: JSON.stringify([
      {
        id: 1,
        AppointmentDate: '20/12/2025',
        AppointmentTime: '09:30',
        AttendingDoctor: 'Siva'
      }
    ])
  }
];

const assetsDir = path.join(__dirname, 'src', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create workbook and worksheet
const worksheet = XLSX.utils.json_to_sheet(patients);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');

// Write to file
const filePath = path.join(assetsDir, 'patients.xlsx');
XLSX.writeFile(workbook, filePath);

console.log('patients.xlsx updated successfully with MR IDs!');
console.log(`File location: ${filePath}`);
