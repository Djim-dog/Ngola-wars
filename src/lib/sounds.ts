// Sons processuais via Web Audio API (sem ficheiros externos)

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

function beep(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  volume = 0.08,
  delay = 0
) {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(c.destination);

  const t = c.currentTime + delay;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export function soundMove() {
  beep(320, 0.06, 'triangle', 0.05);
}

export function soundCapture() {
  beep(180, 0.08, 'sawtooth', 0.1);
  beep(120, 0.12, 'square', 0.07, 0.06);
  beep(90, 0.15, 'sawtooth', 0.05, 0.12);
}

export function soundKing() {
  beep(440, 0.1, 'sine', 0.08);
  beep(554, 0.12, 'sine', 0.08, 0.1);
  beep(659, 0.18, 'sine', 0.1, 0.22);
}

export function soundWin() {
  beep(523, 0.12, 'sine', 0.08);
  beep(659, 0.12, 'sine', 0.08, 0.12);
  beep(784, 0.2, 'sine', 0.1, 0.24);
}

export function soundLose() {
  beep(300, 0.15, 'sawtooth', 0.06);
  beep(200, 0.2, 'sawtooth', 0.06, 0.15);
}
