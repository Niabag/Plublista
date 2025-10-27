const electron = require('electron');

console.log('Type of electron:', typeof electron);
console.log('Electron value:', electron);
console.log('Electron keys:', electron ? Object.keys(electron) : 'none');

// Try to access app differently
console.log('Process type:', process.type);
console.log('Process versions:', process.versions);

if (typeof electron === 'string') {
  console.log('ERROR: electron is a string (path), not the module!');
  console.log('This means the script is running in Node.js, not Electron');
}
