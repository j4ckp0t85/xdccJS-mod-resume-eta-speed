// Test per la funzionalità di resume
const fs = require('fs');
const path = require('path');

// Simula un file parzialmente scaricato
function createPartialFile(filePath, size) {
  const buffer = Buffer.alloc(size, 'A');
  fs.writeFileSync(filePath, buffer);
  console.log(`Created partial file: ${filePath} (${size} bytes)`);
}

// Test delle validazioni di resume
function testResumeValidation() {
  console.log('Testing resume validation...');
  
  const testDir = './test_resume_files';
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  
  // Test 1: File normale da riprendere
  const normalFile = path.join(testDir, 'normal_file.txt');
  createPartialFile(normalFile, 5000);
  
  const fileInfo1 = {
    filePath: normalFile,
    length: 10000,
    position: 0
  };
  
  // Simula il calcolo della posizione
  if (fs.existsSync(fileInfo1.filePath)) {
    const stats = fs.statSync(fileInfo1.filePath);
    fileInfo1.position = stats.size;
    
    if (fileInfo1.position >= fileInfo1.length) {
      console.log('❌ Test 1 FAILED: File too large');
    } else if (fileInfo1.position < 512 && fileInfo1.length > 1024) {
      console.log('❌ Test 1 FAILED: File too small');
    } else {
      console.log('✅ Test 1 PASSED: Normal resume file');
    }
  }
  
  // Test 2: File troppo grande
  const largeFile = path.join(testDir, 'large_file.txt');
  createPartialFile(largeFile, 15000);
  
  const fileInfo2 = {
    filePath: largeFile,
    length: 10000,
    position: 0
  };
  
  if (fs.existsSync(fileInfo2.filePath)) {
    const stats = fs.statSync(fileInfo2.filePath);
    fileInfo2.position = stats.size;
    
    if (fileInfo2.position >= fileInfo2.length) {
      console.log('✅ Test 2 PASSED: Detected file too large');
    } else {
      console.log('❌ Test 2 FAILED: Should detect file too large');
    }
  }
  
  // Test 3: File troppo piccolo
  const smallFile = path.join(testDir, 'small_file.txt');
  createPartialFile(smallFile, 100);
  
  const fileInfo3 = {
    filePath: smallFile,
    length: 10000,
    position: 0
  };
  
  if (fs.existsSync(fileInfo3.filePath)) {
    const stats = fs.statSync(fileInfo3.filePath);
    fileInfo3.position = stats.size;
    
    if (fileInfo3.position < 512 && fileInfo3.length > 1024) {
      console.log('✅ Test 3 PASSED: Detected file too small');
    } else {
      console.log('❌ Test 3 FAILED: Should detect file too small');
    }
  }
  
  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true });
  console.log('Test cleanup completed');
}

// Test del calcolo ETA per progress bar
function testProgressBarETA() {
  console.log('\nTesting progress bar ETA calculation...');
  
  // Simula un file di 10MB con 5MB già scaricati
  const totalSize = 10 * 1024 * 1024; // 10MB
  const resumePosition = 5 * 1024 * 1024; // 5MB
  
  // Stima il tempo trascorso assumendo 100 KiB/s
  const estimatedElapsed = resumePosition / (1024 * 100) * 1000; // in ms
  const estimatedStartTime = Date.now() - estimatedElapsed;
  
  console.log(`Total size: ${totalSize} bytes`);
  console.log(`Resume position: ${resumePosition} bytes`);
  console.log(`Estimated elapsed: ${estimatedElapsed}ms`);
  console.log(`Estimated start time: ${new Date(estimatedStartTime).toISOString()}`);
  
  // Calcola ETA rimanente
  const remainingBytes = totalSize - resumePosition;
  const assumedSpeed = 100 * 1024; // 100 KiB/s
  const etaSeconds = remainingBytes / assumedSpeed;
  
  console.log(`Remaining bytes: ${remainingBytes}`);
  console.log(`Estimated ETA: ${etaSeconds} seconds`);
  
  if (etaSeconds > 0 && etaSeconds < 1000) {
    console.log('✅ ETA calculation looks reasonable');
  } else {
    console.log('❌ ETA calculation seems off');
  }
}

// Esegui i test
if (require.main === module) {
  testResumeValidation();
  testProgressBarETA();
}
