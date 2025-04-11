import os
import subprocess
import re
import sys
from pathlib import Path

def get_audio_duration(file_path):
    """
    Get the duration of an audio file using afinfo command on macOS.
    Returns duration in seconds as a float.
    """
    try:
        # Run afinfo command and capture output
        result = subprocess.run(['afinfo', file_path], capture_output=True, text=True)
        
        # Check if command executed successfully
        if result.returncode != 0:
            return None
            
        # Extract duration using regex
        output = result.stdout
        duration_match = re.search(r'estimated duration: (\d+\.\d+) sec', output)
        
        if duration_match:
            return float(duration_match.group(1))
        else:
            return None
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None

def main():
    # Get the directory of the current script
    script_dir = Path(__file__).parent.absolute()
    
    # Common audio file extensions
    audio_extensions = ['.mp3', '.wav', '.aac', '.m4a', '.aif', '.aiff', '.flac', '.ogg']
    
    # Find all audio files in the directory
    audio_files = []
    for file in os.listdir(script_dir):
        file_path = os.path.join(script_dir, file)
        if os.path.isfile(file_path) and os.path.splitext(file)[1].lower() in audio_extensions:
            audio_files.append(file_path)
    
    # If no audio files found
    if not audio_files:
        print("No audio files found in the current directory.")
        return
        
    # Process each audio file
    print("\nAudio Files Duration Report")
    print("-" * 50)
    print(f"{'File Name':<40} {'Duration':<15}")
    print("-" * 50)
    
    for file_path in sorted(audio_files):
        file_name = os.path.basename(file_path)
        duration = get_audio_duration(file_path)
        
        if duration is not None:
            # Format duration string based on length
            if duration < 1.0:
                # For files under a second, show more precision
                duration_str = f"{duration:.3f} sec"
            else:
                # Format as minutes:seconds for longer files
                minutes = int(duration // 60)
                seconds = duration % 60
                if minutes > 0:
                    duration_str = f"{minutes}:{seconds:06.3f}"
                else:
                    duration_str = f"{seconds:.3f} sec"
                    
            print(f"{file_name:<40} {duration_str:<15}")
        else:
            print(f"{file_name:<40} Unable to determine duration")
    
    print("-" * 50)

if __name__ == "__main__":
    main()