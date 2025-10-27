const { app, BrowserWindow, shell } = require('electron');
const { join } = require('path');
const { spawn } = require('child_process');

let mainWindow;
let vscodeProcess;
let targetFile = null; // File to open in VS Code (from command line args)

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: false,
    backgroundColor: '#1e1e1e',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    }
  });

  // Charge la page HTML de l'application Electron
  mainWindow.loadFile(join(__dirname, 'index.html'));

  // Après le chargement de la page, injecter le fichier cible
  mainWindow.webContents.on('did-finish-load', () => {
    // Passer le fichier cible au renderer process
    if (targetFile) {
      mainWindow.webContents.executeJavaScript(`
        window.targetFile = ${JSON.stringify(targetFile)};
        window.dispatchEvent(new CustomEvent('target-file-ready'));
      `);
    } else {
      // Mode normal : afficher l'app React
      mainWindow.webContents.executeJavaScript(`
        window.targetFile = null;
        window.dispatchEvent(new CustomEvent('target-file-ready'));
      `);
    }
  });

  // Ouvre les liens externes dans le navigateur par défaut
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Fonction pour ouvrir VS Code dans un workspace spécifique
function openVSCode() {
  const vscodePath = process.env.VSCODE_PATH || 'code';
  
  // Si un fichier cible est spécifié, ouvrir ce fichier, sinon ouvrir le projet
  const pathToOpen = targetFile || join(__dirname, '..');
  
  console.log(`Opening VS Code with: ${pathToOpen}`);
  
  vscodeProcess = spawn(vscodePath, [pathToOpen], {
    detached: true,
    stdio: 'ignore'
  });
  
  vscodeProcess.unref();
}

// Parse command line arguments
function parseArguments() {
  const args = process.argv.slice(2); // Skip electron and main.js
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Support --file=path or --file path
    if (arg.startsWith('--file=')) {
      targetFile = arg.substring(7);
      console.log(`Target file from args: ${targetFile}`);
    } else if (arg === '--file' && i + 1 < args.length) {
      targetFile = args[i + 1];
      console.log(`Target file from args: ${targetFile}`);
      i++; // Skip next arg
    }
  }
}

app.whenReady().then(() => {
  // Parse arguments first
  parseArguments();
  
  createWindow();
  
  // Ouvre automatiquement VS Code
  setTimeout(() => {
    openVSCode();
  }, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (vscodeProcess) {
    vscodeProcess.kill();
  }
});
