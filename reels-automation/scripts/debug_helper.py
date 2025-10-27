#!/usr/bin/env python3
"""
Debug Helper - Python wrapper for debugging tools
Provides easy access to all debugging and validation tools
"""

import sys
import subprocess
import argparse
from pathlib import Path
import json

def run_powershell_script(script_name, args=None):
    """Run a PowerShell script and return output"""
    script_path = Path(__file__).parent / script_name
    
    cmd = ['powershell', '-ExecutionPolicy', 'Bypass', '-File', str(script_path)]
    if args:
        cmd.extend(args)
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        return result.returncode
    except Exception as e:
        print(f"Error running script: {e}", file=sys.stderr)
        return 1

def validate_environment(fix=False):
    """Validate the environment"""
    print("🔍 Running environment validation...")
    args = ['-FixIssues'] if fix else []
    return run_powershell_script('validate_environment.ps1', args)

def debug_ffmpeg(input_file=None, output_file=None):
    """Run FFmpeg debugger"""
    print("🔍 Running FFmpeg debugger...")
    args = []
    if input_file:
        args.extend(['-InputFile', input_file])
    if output_file:
        args.extend(['-OutputFile', output_file])
    return run_powershell_script('debug_ffmpeg.ps1', args)

def analyze_logs(log_text=None, log_file=None):
    """Analyze logs for common issues"""
    print("📊 Analyzing logs for common issues...")
    
    issues = []
    
    if log_file:
        with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
            log_text = f.read()
    
    if not log_text:
        print("No logs provided")
        return
    
    # Check for common issues
    if "Error opening input file -af" in log_text:
        issues.append({
            "severity": "ERROR",
            "component": "FFmpeg",
            "issue": "Invalid FFmpeg command syntax",
            "description": "FFmpeg is interpreting the -af flag as a filename",
            "solution": "This is a PowerShell array construction issue. Check compose_ffmpeg.ps1"
        })
    
    if "No such file or directory" in log_text and "step" in log_text.lower():
        issues.append({
            "severity": "ERROR",
            "component": "FFmpeg",
            "issue": "Missing intermediate file",
            "description": "A previous step failed to create its output file",
            "solution": "Check if step 1 or step 2 failed. Enable debug mode in compose_ffmpeg.ps1"
        })
    
    if "FFmpeg not found" in log_text or "is not recognized" in log_text:
        issues.append({
            "severity": "CRITICAL",
            "component": "FFmpeg",
            "issue": "FFmpeg not installed or not in PATH",
            "solution": "Install FFmpeg or add it to PATH. Run: py debug_helper.py --validate --fix"
        })
    
    if "VS Code" in log_text and "failed" in log_text.lower():
        issues.append({
            "severity": "ERROR",
            "component": "VS Code",
            "issue": "VS Code failed to open",
            "solution": "Ensure VS Code is installed and 'code' command is available"
        })
    
    if "OBS" in log_text and ("failed" in log_text.lower() or "error" in log_text.lower()):
        issues.append({
            "severity": "ERROR",
            "component": "OBS",
            "issue": "OBS recording issue",
            "solution": "Check OBS is running and WebSocket server is enabled"
        })
    
    # Display issues
    if not issues:
        print("✅ No known issues found in logs")
        return
    
    print(f"\n❌ Found {len(issues)} issue(s):\n")
    
    for i, issue in enumerate(issues, 1):
        severity_colors = {
            "CRITICAL": "🔴",
            "ERROR": "🟠",
            "WARNING": "🟡"
        }
        color = severity_colors.get(issue["severity"], "⚪")
        
        print(f"{color} Issue #{i}: {issue['issue']}")
        print(f"   Severity: {issue['severity']}")
        print(f"   Component: {issue['component']}")
        print(f"   Description: {issue['description']}")
        print(f"   Solution: {issue['solution']}")
        print()

def test_video_file(video_path):
    """Test a video file with FFmpeg"""
    print(f"🎬 Testing video file: {video_path}")
    
    if not Path(video_path).exists():
        print(f"❌ File not found: {video_path}")
        return 1
    
    # Test with ffprobe
    try:
        result = subprocess.run(
            ['ffprobe', '-v', 'error', '-show_format', '-show_streams', 
             '-print_format', 'json', video_path],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            
            print("\n✅ Video file is valid")
            print(f"\nFormat: {data['format'].get('format_long_name', 'Unknown')}")
            print(f"Duration: {float(data['format'].get('duration', 0)):.2f}s")
            print(f"Size: {int(data['format'].get('size', 0)) / 1024 / 1024:.2f} MB")
            
            # Video streams
            video_streams = [s for s in data.get('streams', []) if s['codec_type'] == 'video']
            if video_streams:
                v = video_streams[0]
                print(f"\nVideo:")
                print(f"  Codec: {v.get('codec_name', 'Unknown')}")
                print(f"  Resolution: {v.get('width', '?')}x{v.get('height', '?')}")
                print(f"  Frame rate: {v.get('r_frame_rate', 'Unknown')}")
            
            # Audio streams
            audio_streams = [s for s in data.get('streams', []) if s['codec_type'] == 'audio']
            if audio_streams:
                a = audio_streams[0]
                print(f"\nAudio:")
                print(f"  Codec: {a.get('codec_name', 'Unknown')}")
                print(f"  Sample rate: {a.get('sample_rate', 'Unknown')} Hz")
                print(f"  Channels: {a.get('channels', 'Unknown')}")
            
            return 0
        else:
            print(f"❌ FFprobe error: {result.stderr}")
            return 1
            
    except FileNotFoundError:
        print("❌ FFprobe not found. Please install FFmpeg.")
        return 1
    except json.JSONDecodeError:
        print("❌ Could not parse video info")
        return 1
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1

def main():
    parser = argparse.ArgumentParser(
        description='Debug Helper - Diagnostic tools for Reels Automation',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Validate environment
  py debug_helper.py --validate
  
  # Validate and fix issues
  py debug_helper.py --validate --fix
  
  # Debug FFmpeg with video file
  py debug_helper.py --ffmpeg-debug --input "path/to/video.mp4"
  
  # Analyze log file
  py debug_helper.py --analyze-logs --log-file "error.log"
  
  # Test video file
  py debug_helper.py --test-video "path/to/video.mp4"
        """
    )
    
    parser.add_argument('--validate', action='store_true',
                        help='Validate environment')
    parser.add_argument('--fix', action='store_true',
                        help='Attempt to fix issues (use with --validate)')
    parser.add_argument('--ffmpeg-debug', action='store_true',
                        help='Run FFmpeg debugger')
    parser.add_argument('--input', '-i', type=str,
                        help='Input video file')
    parser.add_argument('--output', '-o', type=str,
                        help='Output video file')
    parser.add_argument('--analyze-logs', action='store_true',
                        help='Analyze logs for issues')
    parser.add_argument('--log-file', type=str,
                        help='Path to log file to analyze')
    parser.add_argument('--test-video', type=str,
                        help='Test a video file')
    
    args = parser.parse_args()
    
    # Show header
    print("=" * 50)
    print("   🔧 Reels Automation Debug Helper")
    print("=" * 50)
    print()
    
    # Execute requested action
    if args.validate:
        return validate_environment(fix=args.fix)
    
    elif args.ffmpeg_debug:
        return debug_ffmpeg(input_file=args.input, output_file=args.output)
    
    elif args.analyze_logs:
        if args.log_file:
            return analyze_logs(log_file=args.log_file)
        else:
            print("Please provide a log file with --log-file")
            return 1
    
    elif args.test_video:
        return test_video_file(args.test_video)
    
    else:
        parser.print_help()
        print("\n💡 Tip: Start with --validate to check your environment")
        return 0

if __name__ == '__main__':
    sys.exit(main())
