// Script pour corriger automatiquement les erreurs TypeScript/ESLint
const fs = require('fs');
const path = require('path');

const files = [
  'src/app/App.tsx',
  'src/app/components/ActivityHistory.tsx',
  'src/app/components/CheckoutAlertModal.tsx',
  'src/app/components/ClientsPage.tsx',
  'src/app/components/DashBoard.tsx',
  'src/app/components/Login.tsx',
  'src/app/components/LoginPage.tsx',
  'src/app/components/PerformanceHistory.tsx',
  'src/app/components/ProtectedRoute.tsx',
  'src/app/components/ReservationPage.tsx',
  'src/app/components/RoomsPage.tsx',
  'src/app/components/UserManagement.tsx',
  'src/app/context/ActivityLogContext.tsx',
  'src/app/utils/generateTestData.ts',
  'src/app/utils/syncData.ts'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix apostrophes
    content = content.replace(/'/g, '&apos;');
    
    // Fix any types
    content = content.replace(/: any\b/g, ': unknown');
    content = content.replace(/\(.*?: any\)/g, (match) => match.replace('any', 'unknown'));
    
    // Fix unused variables
    content = content.replace(/} catch \(error\) {/g, '} catch {');
    content = content.replace(/} catch \(.*?\) {/g, '} catch {');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  }
});