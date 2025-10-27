const { app } = require('electron');

console.log('Electron app:', app);
console.log('App version:', app ? app.getVersion() : 'undefined');

if (app) {
  app.whenReady().then(() => {
    console.log('Electron is ready!');
    app.quit();
  });
} else {
  console.error('ERROR: app is undefined!');
  process.exit(1);
}
