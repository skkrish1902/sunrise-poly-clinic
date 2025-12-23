const XLSX = require('xlsx');
const path = require('path');

// Patient data
const patients = [
  {
    Name: 'Sai Krishna',
    Age: 30,
    Address: 'F.no 203, Dr Padmasree Abode, Yapral, Hyderabad 500087',
    LastVisit: '17/12/2025',
    AttendingDoctor: 'Dr. Ramesh'
  },
  {
    Name: 'Rajesh Kumar',
    Age: 45,
    Address: 'F.no 105, Meridian Apartments, Secunderabad, Hyderabad 500003',
    LastVisit: '15/12/2025',
    AttendingDoctor: 'Dr. Priya'
  },
  {
    Name: 'Priya Sharma',
    Age: 28,
    Address: 'F.no 302, Skyline Towers, Banjara Hills, Hyderabad 500034',
    LastVisit: '16/12/2025',
    AttendingDoctor: 'Dr. Ramesh'
  }
];

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Convert patient data to worksheet
const worksheet = XLSX.utils.json_to_sheet(patients);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');

// Write to file
const outputPath = path.join(__dirname, 'src', 'assets', 'patients.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('Excel file created successfully at:', outputPath);
