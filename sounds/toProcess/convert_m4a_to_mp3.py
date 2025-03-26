#!/usr/bin/env python3
import os
from pydub import AudioSegment

def convert_to_mp3(input_file, bitrate="192k"):
    """
    Convert an M4A, MP4 or WEBM file to MP3 format
    
    Args:
        input_file (str): Path to the input audio file
        bitrate (str, optional): Bitrate for the output MP3 file. Default is "192k"
    
    Returns:
        str: Path to the created MP3 file
    """
    # Create output filename
    output_file = os.path.splitext(input_file)[0] + '.mp3'
    
    # Determine input format
    input_format = os.path.splitext(input_file)[1].lower().lstrip('.')
    
    # Load the audio file
    audio = AudioSegment.from_file(input_file, format=input_format)
    
    # Export as MP3
    audio.export(output_file, format="mp3", bitrate=bitrate)
    
    return output_file

def main():
    """Convert all M4A, MP4, and WEBM files in the current directory to MP3 format"""
    # Get current directory
    current_dir = os.getcwd()
    
    # Count for summary
    converted_count = 0
    skipped_count = 0
    error_count = 0
    
    print("Starting conversion of M4A, MP4, and WEBM files to MP3...")
    
    # Process all files in current directory
    for filename in os.listdir(current_dir):
        lower_filename = filename.lower()
        if lower_filename.endswith('.m4a') or lower_filename.endswith('.mp4') or lower_filename.endswith('.webm'):
            try:
                output_file = convert_to_mp3(filename)
                print(f"Converted: {filename} -> {output_file}")
                converted_count += 1
            except Exception as e:
                print(f"Error converting {filename}: {str(e)}")
                error_count += 1
        else:
            skipped_count += 1
    
    # Print summary
    print("\nConversion Complete!")
    print(f"Files converted: {converted_count}")
    print(f"Files skipped (not M4A/MP4/WEBM): {skipped_count - error_count}")
    print(f"Errors: {error_count}")

if __name__ == "__main__":
    main()