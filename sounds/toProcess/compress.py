import os
import sys
import subprocess
import argparse

def compress_audio_files(input_folder=None, bitrate='192k'):
    """
    Compress audio files in the input folder using FFmpeg, 
    saving processed files in a new 'compressed' subfolder.
    
    :param input_folder: Path to the folder containing audio files (uses current directory if not specified)
    :param bitrate: Target bitrate for compression (default: 192k)
    """
    # Use current directory if no input folder specified
    if input_folder is None:
        input_folder = os.getcwd()
    
    # Normalize the path
    input_folder = os.path.abspath(input_folder)
    
    # Create output folder (compressed subfolder in the input directory)
    output_folder = os.path.join(input_folder, 'compressed')
    os.makedirs(output_folder, exist_ok=True)
    
    # Ensure input folder exists
    if not os.path.isdir(input_folder):
        print(f"Error: The input path '{input_folder}' is not a valid directory.")
        sys.exit(1)
    
    # Supported audio file extensions
    audio_extensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma']
    
    # Counter for processed files
    processed_files = 0
    skipped_files = 0
    
    # Iterate through files in the input folder
    for filename in os.listdir(input_folder):
        # Get full file path
        input_path = os.path.join(input_folder, filename)
        
        # Check if it's a file and has an audio extension
        if os.path.isfile(input_path) and os.path.splitext(filename)[1].lower() in audio_extensions:
            # Prepare output path in the compressed folder
            output_path = os.path.join(output_folder, filename)
            
            try:
                # FFmpeg command for audio compression
                ffmpeg_command = [
                    'ffmpeg', 
                    '-i', input_path, 
                    '-b:a', bitrate, 
                    '-map_metadata', '0', 
                    '-y', 
                    output_path
                ]
                
                # Run FFmpeg command
                result = subprocess.run(ffmpeg_command, 
                                        capture_output=True, 
                                        text=True)
                
                # Check if compression was successful
                if os.path.exists(output_path):
                    print(f"Compressed: {filename}")
                    processed_files += 1
                else:
                    print(f"Failed to compress: {filename}")
                    skipped_files += 1
            
            except Exception as e:
                print(f"Error processing {filename}: {e}")
                skipped_files += 1
    
    # Print summary
    print("\nCompression Summary:")
    print(f"Total files processed: {processed_files}")
    print(f"Files skipped: {skipped_files}")
    print(f"Output folder: {output_folder}")

def main():
    # Set up argument parsing
    parser = argparse.ArgumentParser(description='Compress audio files in a folder')
    parser.add_argument('-i', '--input_folder', 
                        default=None, 
                        help='Path to the folder containing audio files (uses current directory if not specified)')
    parser.add_argument('-b', '--bitrate', 
                        default='192k', 
                        help='Target bitrate for compression (default: 192k)')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Call compression function
    compress_audio_files(
        args.input_folder, 
        args.bitrate
    )

if __name__ == '__main__':
    main()