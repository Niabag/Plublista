# Environment Validation Script
# Validates the entire automation environment before running

param(
    [switch]$FixIssues = $false
)

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$script:issuesFound = 0
$script:issuesFixed = 0

function Test-Requirement {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [scriptblock]$Fix = $null
    )
    
    Write-Host "`nChecking: $Name" -ForegroundColor Cyan
    $result = & $Test
    
    if ($result) {
        Write-Host "  [OK]" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  [FAILED]" -ForegroundColor Red
        $script:issuesFound++
        
        if ($FixIssues -and $Fix) {
            Write-Host "  [FIX] Attempting fix..." -ForegroundColor Yellow
            try {
                & $Fix
                Write-Host "  [OK] Fixed!" -ForegroundColor Green
                $script:issuesFixed++
                return $true
            } catch {
                Write-Host "  [ERROR] Fix failed: $_" -ForegroundColor Red
                return $false
            }
        } else {
            return $false
        }
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Environment Validation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get base path
$basePath = Split-Path -Parent $PSScriptRoot

# 1. FFmpeg
Test-Requirement -Name "FFmpeg Installation" -Test {
    try {
        $null = & ffmpeg -version 2>&1
        return $true
    } catch {
        Write-Host "    FFmpeg not found in PATH" -ForegroundColor Yellow
        
        # Check WinGet location
        $wingetPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin\ffmpeg.exe"
        if (Test-Path $wingetPath) {
            Write-Host "    Found in WinGet location" -ForegroundColor Yellow
            return $true
        }
        return $false
    }
} -Fix {
    $wingetPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin"
    $env:Path = $env:Path + ";" + $wingetPath
}

# 2. Python
Test-Requirement -Name "Python Installation" -Test {
    try {
        $version = & python --version 2>&1
        Write-Host "    Version: $version" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "    Python not found" -ForegroundColor Yellow
        return $false
    }
}

# 3. Node.js
Test-Requirement -Name "Node.js Installation" -Test {
    try {
        $version = & node --version 2>&1
        Write-Host "    Version: $version" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "    Node.js not found" -ForegroundColor Yellow
        return $false
    }
}

# 4. Config file
Test-Requirement -Name "Config File (config.yaml)" -Test {
    $configPath = Join-Path $basePath "config.yaml"
    if (Test-Path $configPath) {
        Write-Host "    Path: $configPath" -ForegroundColor Gray
        return $true
    }
    Write-Host "    Missing: $configPath" -ForegroundColor Yellow
    return $false
}

# 5. Python dependencies
Test-Requirement -Name "Python Dependencies" -Test {
    try {
        python -c "import yaml, pyautogui, obsws_python, pygetwindow" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
    } catch {}
    Write-Host "    Missing Python packages" -ForegroundColor Yellow
    return $false
} -Fix {
    & python -m pip install pyyaml pyautogui obsws-python pygetwindow --quiet
}

# 6. Assets directory
Test-Requirement -Name "Assets Directory" -Test {
    $assetsPath = Join-Path $basePath "assets"
    if (Test-Path $assetsPath) {
        Write-Host "    Path: $assetsPath" -ForegroundColor Gray
        return $true
    }
    Write-Host "    Missing: $assetsPath" -ForegroundColor Yellow
    return $false
} -Fix {
    $assetsPath = Join-Path $basePath "assets"
    New-Item -ItemType Directory -Path $assetsPath -Force | Out-Null
    New-Item -ItemType Directory -Path "$assetsPath\brand" -Force | Out-Null
    New-Item -ItemType Directory -Path "$assetsPath\music" -Force | Out-Null
}

# 7. Brand logo
Test-Requirement -Name "Brand Logo (optional)" -Test {
    $logoPath = Join-Path $basePath "assets\brand\logo.png"
    if (Test-Path $logoPath) {
        $size = (Get-Item $logoPath).Length / 1KB
        Write-Host "    Size: $([math]::Round($size, 2)) KB" -ForegroundColor Gray
        return $true
    }
    Write-Host "    Not found (will skip branding)" -ForegroundColor Yellow
    return $true  # Not critical
}

# 8. Music track
Test-Requirement -Name "Music Track (optional)" -Test {
    $musicPath = Join-Path $basePath "assets\music\tech-energy.mp3"
    if (Test-Path $musicPath) {
        $size = (Get-Item $musicPath).Length / 1MB
        Write-Host "    Size: $([math]::Round($size, 2)) MB" -ForegroundColor Gray
        return $true
    }
    Write-Host "    Not found (will skip music)" -ForegroundColor Yellow
    return $true  # Not critical
}

# 9. Output directories
Test-Requirement -Name "Output Directories" -Test {
    $outPath = Join-Path $basePath "out"
    $finalPath = Join-Path $outPath "final"
    
    if ((Test-Path $outPath) -and (Test-Path $finalPath)) {
        return $true
    }
    Write-Host "    Missing output directories" -ForegroundColor Yellow
    return $false
} -Fix {
    $outPath = Join-Path $basePath "out"
    $finalPath = Join-Path $outPath "final"
    New-Item -ItemType Directory -Path $finalPath -Force | Out-Null
}

# 10. Workspace directory
Test-Requirement -Name "Workspace Directory" -Test {
    $workspacePath = Join-Path $basePath "workspace"
    if (Test-Path $workspacePath) {
        return $true
    }
    Write-Host "    Missing workspace directory" -ForegroundColor Yellow
    return $false
} -Fix {
    $workspacePath = Join-Path $basePath "workspace"
    New-Item -ItemType Directory -Path $workspacePath -Force | Out-Null
}

# 11. VS Code
Test-Requirement -Name "VS Code" -Test {
    try {
        $null = & code --version 2>&1
        return $true
    } catch {
        Write-Host "    VS Code 'code' command not found" -ForegroundColor Yellow
        return $false
    }
}

# 12. OBS Studio
Test-Requirement -Name "OBS Studio" -Test {
    $obsPath = "C:\Program Files\obs-studio\bin\64bit\obs64.exe"
    if (Test-Path $obsPath) {
        Write-Host "    Path: $obsPath" -ForegroundColor Gray
        return $true
    }
    Write-Host "    OBS not found at default location" -ForegroundColor Yellow
    return $false
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Validation Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($script:issuesFound -eq 0) {
    Write-Host "[SUCCESS] All requirements met!" -ForegroundColor Green
    Write-Host "You can run the automation safely." -ForegroundColor Gray
    exit 0
} else {
    Write-Host "[ERROR] Found $($script:issuesFound) issue(s)" -ForegroundColor Red
    
    if ($script:issuesFixed -gt 0) {
        Write-Host "[OK] Fixed $($script:issuesFixed) issue(s)" -ForegroundColor Green
    }
    
    $remaining = $script:issuesFound - $script:issuesFixed
    if ($remaining -gt 0) {
        Write-Host "[WARN] $remaining issue(s) remaining" -ForegroundColor Yellow
        Write-Host "`nTo attempt automatic fixes, run:" -ForegroundColor Gray
        Write-Host "  .\validate_environment.ps1 -FixIssues" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "[SUCCESS] All issues fixed!" -ForegroundColor Green
        exit 0
    }
}
