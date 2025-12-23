const XLSX = require('xlsx');
const path = require('path');

// Staff data
const staff = [
  {
    Username: 'Siva',
    Password: 'Siva'
  },
  {
    Username: 'Mahalakshmi',
    Password: 'Mahalakshmi'
  }
];

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Convert staff data to worksheet
const worksheet = XLSX.utils.json_to_sheet(staff);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff');

// Write to file
const outputPath = path.join(__dirname, 'src', 'assets', 'staff.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('Staff Excel file created successfully at:', outputPath);
