#!/usr/bin/env python3
"""
Animation Video Generator
Creates MP4 videos from animation frames using ffmpeg
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

def create_video_from_frames(frames_dir, output_path, fps=2, quality='medium'):
    """
    Create MP4 video from animation frames using ffmpeg
    """
    if not os.path.exists(frames_dir):
        print(f"Error: Frames directory does not exist: {frames_dir}")
        return False
    
    # Check if ffmpeg is available
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: ffmpeg is not installed or not in PATH")
        print("Please install ffmpeg to create videos")
        return False
    
    # Find all frame files
    frame_files = sorted([f for f in os.listdir(frames_dir) if f.endswith('.jpg')])
    
    if not frame_files:
        print(f"Error: No frame files found in {frames_dir}")
        return False
    
    print(f"Creating video from {len(frame_files)} frames...")
    print(f"Input: {frames_dir}")
    print(f"Output: {output_path}")
    print(f"FPS: {fps}")
    print(f"Quality: {quality}")
    
    # Quality settings
    quality_settings = {
        'low': ['-crf', '28'],
        'medium': ['-crf', '23'],
        'high': ['-crf', '18'],
        'lossless': ['-crf', '0']
    }
    
    # Build ffmpeg command
    input_pattern = os.path.join(frames_dir, 'frame_%03d_*.jpg')
    
    cmd = [
        'ffmpeg',
        '-y',  # Overwrite output file
        '-framerate', str(fps),
        '-pattern_type', 'glob',
        '-i', input_pattern,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        *quality_settings.get(quality, quality_settings['medium']),
        '-movflags', '+faststart',  # Enable fast start for web streaming
        output_path
    ]
    
    try:
        print("Running ffmpeg...")
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print("Video created successfully!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"ffmpeg error: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        return False

def create_gif_from_frames(frames_dir, output_path, fps=2, width=800):
    """
    Create animated GIF from animation frames using ffmpeg
    """
    if not os.path.exists(frames_dir):
        print(f"Error: Frames directory does not exist: {frames_dir}")
        return False
    
    frame_files = sorted([f for f in os.listdir(frames_dir) if f.endswith('.jpg')])
    
    if not frame_files:
        print(f"Error: No frame files found in {frames_dir}")
        return False
    
    print(f"Creating animated GIF from {len(frame_files)} frames...")
    
    # Build ffmpeg command for GIF
    input_pattern = os.path.join(frames_dir, 'frame_%03d_*.jpg')
    
    cmd = [
        'ffmpeg',
        '-y',
        '-framerate', str(fps),
        '-pattern_type', 'glob',
        '-i', input_pattern,
        '-vf', f'scale={width}:-1:flags=lanczos,palettegen=reserve_transparent=0',
        '-y', 'palette.png'
    ]
    
    try:
        # Generate palette
        subprocess.run(cmd, capture_output=True, check=True)
        
        # Create GIF using palette
        cmd2 = [
            'ffmpeg',
            '-y',
            '-framerate', str(fps),
            '-pattern_type', 'glob',
            '-i', input_pattern,
            '-i', 'palette.png',
            '-filter_complex', f'scale={width}:-1:flags=lanczos[x];[x][1:v]paletteuse',
            output_path
        ]
        
        subprocess.run(cmd2, capture_output=True, check=True)
        
        # Clean up palette file
        if os.path.exists('palette.png'):
            os.remove('palette.png')
        
        print("Animated GIF created successfully!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"ffmpeg error: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Create videos from animation frames")
    parser.add_argument("--frames-dir", required=True, help="Directory containing frame images")
    parser.add_argument("--output", required=True, help="Output video file path")
    parser.add_argument("--fps", type=float, default=2, help="Frames per second")
    parser.add_argument("--format", choices=['mp4', 'gif'], default='mp4', help="Output format")
    parser.add_argument("--quality", choices=['low', 'medium', 'high', 'lossless'], default='medium', help="Video quality")
    parser.add_argument("--width", type=int, default=800, help="Width for GIF output")
    
    args = parser.parse_args()
    
    print(f"Animation Video Generator")
    print(f"Format: {args.format.upper()}")
    
    if args.format == 'mp4':
        success = create_video_from_frames(
            args.frames_dir, 
            args.output, 
            args.fps, 
            args.quality
        )
    elif args.format == 'gif':
        success = create_gif_from_frames(
            args.frames_dir,
            args.output,
            args.fps,
            args.width
        )
    
    if success:
        file_size = os.path.getsize(args.output)
        print(f"Output file: {args.output}")
        print(f"File size: {file_size / (1024*1024):.1f} MB")
        return 0
    else:
        print("Video creation failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())