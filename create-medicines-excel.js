const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Create medicines.xlsx with sample data
const medicines = [
  {
    Provider: 'Apollo Pharmacy',
    DrugName: 'Paracetamol',
    Quantity: 500,
    TabsPerSheet: 10,
    Available: 'Yes'
  },
  {
    Provider: 'MedPlus',
    DrugName: 'Amoxicillin',
    Quantity: 200,
    TabsPerSheet: 15,
    Available: 'Yes'
  },
  {
    Provider: 'NetMeds',
    DrugName: 'Azithromycin',
    Quantity: 150,
    TabsPerSheet: 6,
    Available: 'No'
  },
  {
    Provider: 'Apollo Pharmacy',
    DrugName: 'Ibuprofen',
    Quantity: 300,
    TabsPerSheet: 10,
    Available: 'Yes'
  },
  {
    Provider: 'MedPlus',
    DrugName: 'Ciprofloxacin',
    Quantity: 0,
    TabsPerSheet: 10,
    Available: 'No'
  }
];

const assetsDir = path.join(__dirname, 'src', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create workbook and worksheet
const worksheet = XLSX.utils.json_to_sheet(medicines);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicines');

// Write to file
const filePath = path.join(assetsDir, 'medicines.xlsx');
XLSX.writeFile(workbook, filePath);

console.log('medicines.xlsx created successfully!');
console.log(`File location: ${filePath}`);
