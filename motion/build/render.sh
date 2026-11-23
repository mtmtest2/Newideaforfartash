#!/bin/bash
# Full pipeline: narration -> voice.wav + timing.js, music bed, loudness normalisation, frames, mp4.
set -e
cd "$(dirname "$0")/.."
python3 build/tts.py /tmp/claude-0/-home-user-Newideaforfartash/a1553dfe-0951-57d0-a160-246f7e9e9b2b/scratchpad/tts/m-ganji-medium/vits-piper-fa_IR-ganji-medium build narration.json
python3 build/music.py build/voice.wav build/mix.wav build/music.wav
ffmpeg -y -loglevel error -i build/mix.wav -af loudnorm=I=-16:TP=-1.5:LRA=7 -ar 44100 build/mix-norm.wav
rm -rf /tmp/claude-0/-home-user-Newideaforfartash/a1553dfe-0951-57d0-a160-246f7e9e9b2b/scratchpad/frames && node /tmp/claude-0/-home-user-Newideaforfartash/a1553dfe-0951-57d0-a160-246f7e9e9b2b/scratchpad/render.cjs index.html /tmp/claude-0/-home-user-Newideaforfartash/a1553dfe-0951-57d0-a160-246f7e9e9b2b/scratchpad/frames 30
ffmpeg -y -loglevel error -framerate 30 -i /tmp/claude-0/-home-user-Newideaforfartash/a1553dfe-0951-57d0-a160-246f7e9e9b2b/scratchpad/frames/%05d.jpg -i build/mix-norm.wav -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest -movflags +faststart ../src/assets/video/fartash-intro-1080.mp4
N=$(ls /tmp/claude-0/-home-user-Newideaforfartash/a1553dfe-0951-57d0-a160-246f7e9e9b2b/scratchpad/frames | wc -l)
ffmpeg -y -loglevel error -i /tmp/claude-0/-home-user-Newideaforfartash/a1553dfe-0951-57d0-a160-246f7e9e9b2b/scratchpad/frames/$(printf %05d $((N-20))).jpg -vf scale=1280:720 -q:v 4 ../assets-src/fartash-intro-poster.jpg
ffprobe -v error -show_entries format=duration -of csv=p=0 ../src/assets/video/fartash-intro-1080.mp4
