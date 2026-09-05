// Web Audio API ambient sounds and synthesizer

class SoundEngine {
  private ctx: AudioContext | null = null;
  private currentAmbientNode: { stop: () => void } | null = null;
  private activeAmbientType: string | null = null;

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play pleasant chime for task/timer completion
  playChime(type: 'complete' | 'bell' | 'alert' | 'buzz' = 'complete') {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      if (type === 'complete') {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0, now + idx * 0.1);
          gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.1 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.65);
        });
      } else if (type === 'bell') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now); // A5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      } else if (type === 'buzz') {
        // Warning buzz for strict mode
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      } else {
        // Alert chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(740, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch {
      // Audio context might be restricted before user interaction
    }
  }

  // Play continuous ambient soundscapes
  startAmbient(type: 'rain' | 'waves' | 'cafe' | 'forest' | 'whitenoise', volume: number = 0.5) {
    this.stopAmbient();
    this.activeAmbientType = type;

    try {
      const ctx = this.getAudioContext();
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Fill buffer with noise depending on ambient type
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
          // Pink/brown filtered noise
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 3.5;
        } else if (type === 'whitenoise') {
          data[i] = white * 0.15;
        } else if (type === 'forest') {
          // Gentle rustle
          lastOut = (lastOut + 0.01 * white) / 1.01;
          data[i] = lastOut * 1.8;
        } else if (type === 'waves') {
          // Ocean waves base
          lastOut = (lastOut + 0.015 * white) / 1.015;
          data[i] = lastOut * 2.8;
        } else {
          // Cafe murmur
          lastOut = (lastOut + 0.03 * white) / 1.03;
          data[i] = lastOut * 2.0;
        }
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;

      const filter = ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
      } else if (type === 'forest') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);
      } else if (type === 'waves') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);
      } else {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);

      // For waves, add periodic LFO modulation
      let lfo: OscillatorNode | null = null;
      if (type === 'waves') {
        lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8 sec ocean swell
        lfoGain.gain.setValueAtTime(volume * 0.25, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(masterGain.gain);
        lfo.start();
      }

      noiseNode.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);
      noiseNode.start();

      this.currentAmbientNode = {
        stop: () => {
          try {
            noiseNode.stop();
            noiseNode.disconnect();
            if (lfo) {
              lfo.stop();
              lfo.disconnect();
            }
          } catch {
            // ignore
          }
        },
      };
    } catch {
      // Audio context might be restricted
    }
  }

  stopAmbient() {
    if (this.currentAmbientNode) {
      this.currentAmbientNode.stop();
      this.currentAmbientNode = null;
    }
    this.activeAmbientType = null;
  }

  getActiveAmbient() {
    return this.activeAmbientType;
  }

  // Voice speech synthesis for Routinery
  speak(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }
}

export const sound = new SoundEngine();
