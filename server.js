const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const PATIENTS_FILE = path.join(__dirname, 'src', 'assets', 'patients.xlsx');
const STAFF_FILE = path.join(__dirname, 'src', 'assets', 'staff.xlsx');
const PATIENT_DETAILS_FILE = path.join(__dirname, 'src', 'assets', 'patient-details.xlsx');
const MEDICINES_FILE = path.join(__dirname, 'src', 'assets', 'medicines.xlsx');

// Staff login endpoint
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!fs.existsSync(STAFF_FILE)) {
      return res.status(500).json({ error: 'Staff file not found' });
    }

    const workbook = XLSX.readFile(STAFF_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const staff = XLSX.utils.sheet_to_json(worksheet);
    
    const validStaff = staff.find(s => s.Username === username && s.Password === password);
    
    if (validStaff) {
      res.json({ success: true, message: 'Login successful', username: validStaff.Username });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all patients
app.get('/api/patients', (req, res) => {
  try {
    if (!fs.existsSync(PATIENTS_FILE)) {
      return res.json([]);
    }

    const workbook = XLSX.readFile(PATIENTS_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const patients = XLSX.utils.sheet_to_json(worksheet);
    
    const patientsWithId = patients.map((patient, index) => {
      // Parse appointments from JSON string if it exists
      let appointments = [];
      if (patient.appointments) {
        try {
          appointments = JSON.parse(patient.appointments);
        } catch (e) {
          appointments = [];
        }
      }
      
      return {
        ...patient,
        id: index + 1,
        appointments: appointments
      };
    });

    res.json(patientsWithId);
  } catch (error) {
    console.error('Error reading patients:', error);
    res.status(500).json({ error: 'Failed to read patients' });
  }
});

// Save patients (used for add, update, delete)
app.post('/api/patients', (req, res) => {
  try {
    const patients = req.body;
    
    // Remove id field and stringify appointments before saving to Excel
    const patientsWithoutId = patients.map(({ id, appointments, ...rest }) => ({
      ...rest,
      appointments: appointments && appointments.length > 0 ? JSON.stringify(appointments) : ''
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(patientsWithoutId);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');
    
    XLSX.writeFile(workbook, PATIENTS_FILE);
    
    res.json({ success: true, message: 'Patients saved successfully' });
  } catch (error) {
    console.error('Error saving patients:', error);
    res.status(500).json({ error: 'Failed to save patients' });
  }
});

// Get all patient details
app.get('/api/patient-details', (req, res) => {
  try {
    if (!fs.existsSync(PATIENT_DETAILS_FILE)) {
      return res.json([]);
    }

    const workbook = XLSX.readFile(PATIENT_DETAILS_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const details = XLSX.utils.sheet_to_json(worksheet);
    
    const detailsWithId = details.map((detail, index) => {
      // Parse medicines from JSON string
      let medicines = [];
      try {
        medicines = detail.medicines ? JSON.parse(detail.medicines) : [];
      } catch (e) {
        medicines = [];
      }
      
      return {
        ...detail,
        medicines,
        id: index + 1
      };
    });

    res.json(detailsWithId);
  } catch (error) {
    console.error('Error reading patient details:', error);
    res.status(500).json({ error: 'Failed to read patient details' });
  }
});

// Save patient details
app.post('/api/patient-details', (req, res) => {
  try {
    const details = req.body;
    
    // Convert medicines array to JSON string and remove id field
    const detailsForExcel = details.map(({ id, medicines, ...rest }) => ({
      ...rest,
      medicines: JSON.stringify(medicines || [])
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(detailsForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PatientDetails');
    
    XLSX.writeFile(workbook, PATIENT_DETAILS_FILE);
    
    res.json({ success: true, message: 'Patient details saved successfully' });
  } catch (error) {
    console.error('Error saving patient details:', error);
    res.status(500).json({ error: 'Failed to save patient details' });
  }
});

// Get all medicines
app.get('/api/medicines', (req, res) => {
  try {
    if (!fs.existsSync(MEDICINES_FILE)) {
      return res.json([]);
    }

    const workbook = XLSX.readFile(MEDICINES_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const medicines = XLSX.utils.sheet_to_json(worksheet);
    
    const medicinesWithId = medicines.map((medicine, index) => ({
      id: index + 1,
      ...medicine
    }));

    res.json(medicinesWithId);
  } catch (error) {
    console.error('Error reading medicines:', error);
    res.status(500).json({ error: 'Failed to read medicines' });
  }
});

// Save medicines (used for add, update, delete)
app.post('/api/medicines', (req, res) => {
  try {
    const medicines = req.body;
    
    // Remove id field before saving to Excel
    const medicinesWithoutId = medicines.map(({ id, ...rest }) => rest);
    
    const worksheet = XLSX.utils.json_to_sheet(medicinesWithoutId);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicines');
    
    XLSX.writeFile(workbook, MEDICINES_FILE);
    
    res.json({ success: true, message: 'Medicines saved successfully' });
  } catch (error) {
    console.error('Error saving medicines:', error);
    res.status(500).json({ error: 'Failed to save medicines' });
  }
});

app.listen(PORT, () => {
  console.log(`Patient API server running on http://localhost:${PORT}`);
});
