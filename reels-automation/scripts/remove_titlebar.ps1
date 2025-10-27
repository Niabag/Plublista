# Remove Window Title Bar
# Makes the Chrome window borderless/frameless

param(
    [int]$ProcessId
)

Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class Win32 {
        [DllImport("user32.dll")]
        public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
        
        [DllImport("user32.dll")]
        public static extern int GetWindowLong(IntPtr hWnd, int nIndex);
        
        [DllImport("user32.dll")]
        public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);
        
        [DllImport("user32.dll")]
        public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
        
        public const int GWL_STYLE = -16;
        public const int WS_CAPTION = 0x00C00000;
        public const int WS_THICKFRAME = 0x00040000;
        public const uint SWP_NOSIZE = 0x0001;
        public const uint SWP_NOMOVE = 0x0002;
        public const uint SWP_NOZORDER = 0x0004;
        public const uint SWP_FRAMECHANGED = 0x0020;
    }
"@

if ($ProcessId) {
    Write-Host "Recherche de la fenêtre Chrome (PID: $ProcessId)..." -ForegroundColor Cyan
    
    # Wait for window to appear
    Start-Sleep -Seconds 2
    
    # Find window by process
    $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    if ($process) {
        $hwnd = $process.MainWindowHandle
        
        if ($hwnd -ne [IntPtr]::Zero) {
            Write-Host "Fenêtre trouvée! Handle: $hwnd" -ForegroundColor Green
            
            # Get current style
            $style = [Win32]::GetWindowLong($hwnd, [Win32]::GWL_STYLE)
            
            # Remove caption and frame
            $newStyle = $style -band (-bnot ([Win32]::WS_CAPTION -bor [Win32]::WS_THICKFRAME))
            
            # Apply new style
            [Win32]::SetWindowLong($hwnd, [Win32]::GWL_STYLE, $newStyle) | Out-Null
            
            # Refresh window
            [Win32]::SetWindowPos($hwnd, [IntPtr]::Zero, 0, 0, 0, 0, 
                [Win32]::SWP_NOMOVE -bor [Win32]::SWP_NOSIZE -bor [Win32]::SWP_NOZORDER -bor [Win32]::SWP_FRAMECHANGED) | Out-Null
            
            Write-Host "✅ Barre de titre retirée avec succès!" -ForegroundColor Green
            Write-Host "   La fenêtre est maintenant sans bordure" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Fenêtre non trouvée pour le processus" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Processus non trouvé" -ForegroundColor Red
    }
} else {
    Write-Host "Usage: .\remove_titlebar.ps1 -ProcessId <PID>" -ForegroundColor Yellow
}
