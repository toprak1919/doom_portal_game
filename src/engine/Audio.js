// src/engine/Audio.js

export class AudioEngine {
  constructor() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();

    // Set a slightly lower master gain for a subtle ambient feel
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.4;
    this.masterGain.connect(this.audioContext.destination);

    // Use a calm, warm scale (C minor pentatonic)
    this.scale = [261.63, 311.13, 349.23, 392.0, 466.16]; // C, Eb, F, G, Bb in Hz

    // Define several chord options for variation
    this.chordProgressions = [
      [0, 2, 4],  // C minor chord
      [0, 1, 3],  // Another variation
      [1, 3, 4],
      [0, 3, 4]
    ];

    this.noteInterval = 8; // seconds per chord cycle
    this.nextChordTime = this.audioContext.currentTime + 0.1;

    this.startAmbientMusic();
  }

  startAmbientMusic() {
    this.scheduleNextChord();

    setInterval(() => {
      while (this.nextChordTime < this.audioContext.currentTime + 0.5) {
        this.scheduleNextChord();
      }
    }, 200);
  }

  scheduleNextChord() {
    const chordIndices = this.chordProgressions[Math.floor(Math.random() * this.chordProgressions.length)];
    const detuneFactor = 1 + (Math.random() - 0.5) * 0.03; // ±1.5%

    chordIndices.forEach((noteIndex, i) => {
      const frequency = this.scale[noteIndex] * detuneFactor;
      this.scheduleNote(frequency, this.nextChordTime + i * 0.5, 7);
    });

    this.schedulePad(this.nextChordTime, 8);
    this.nextChordTime += this.noteInterval;
  }

  scheduleNote(frequency, startTime, duration) {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    const gainNode = this.audioContext.createGain();
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.05, startTime + 1);
    gainNode.gain.setValueAtTime(0.05, startTime + duration - 1);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  schedulePad(startTime, duration) {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = this.scale[0] * 0.5; // Half of C, for a deep pad

    const gainNode = this.audioContext.createGain();
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.03, startTime + 2);
    gainNode.gain.setValueAtTime(0.03, startTime + duration - 2);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  playGunshot() {
    const now = this.audioContext.currentTime;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    
    gainNode.gain.setValueAtTime(1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
    
    this.playNoiseBurst(0.1);
  }

  playPortalSound() {
    const now = this.audioContext.currentTime;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(2000, now + 0.3);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.linearRampToValueAtTime(2000, now + 0.3);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  playFootstep() {
    const now = this.audioContext.currentTime;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(60, now);
    oscillator.frequency.exponentialRampToValueAtTime(30, now + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0, now + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  playNoiseBurst(duration) {
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    const gainNode = this.audioContext.createGain();
    
    gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    noise.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    noise.start();
  }

  setVolume(value) {
    this.masterGain.gain.setValueAtTime(value, this.audioContext.currentTime);
  }

  toggleAudio(isPaused) {
    if (isPaused) {
      this.audioContext.suspend();
    } else {
      this.audioContext.resume();
    }
  }
} 