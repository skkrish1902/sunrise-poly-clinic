# How to Run the Application

## Option 1: Run Both Servers Together (Recommended)
```bash
npm run dev
```
This will start both:
- API Server on http://localhost:3000
- Angular App on http://localhost:4200

## Option 2: Run Servers Separately

### Terminal 1 - Start API Server:
```bash
npm run server
```

### Terminal 2 - Start Angular App:
```bash
npm start
```

## Important Notes:
- The API server MUST be running for patient data to load and save
- All changes (add, edit, delete) will automatically update the `src/assets/patients.xlsx` file
- The API server runs on port 3000
- The Angular app runs on port 4200

## Current Setup:
- Login credentials: admin / admin
- Patient data is stored in: `src/assets/patients.xlsx`
- Changes are persisted to the Excel file in real-time
