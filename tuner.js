const notes = document.querySelectorAll('.note');
const needle = document.querySelector('.needle');
const frequencyDisplay = document.querySelector('.frequency-display');
const instruction = document.querySelector('.instruction');

let currentFrequency = 0;
let targetFrequency = 0;
let isRecording = false;
let audioContext;
let analyser;
const FFT_SIZE = 2048; // Adjust the FFT size as needed for your application

// Initialize audio context and start microphone access
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    updateTuner();
  })
  .catch(error => {
    console.error('Error accessing microphone:', error);
  });

notes.forEach((note, index) => {
  note.addEventListener('click', () => {
    selectString(index);
  });
});

function selectString(index) {
  notes.forEach(note => note.classList.remove('active'));
  notes[index].classList.add('active');

  const frequencies = [392.0, 293.7, 440.0, 329.6];
  targetFrequency = frequencies[index];
  instruction.textContent = 'Play the string and tune it';
  isRecording = true;
}

function updateTuner() {
  if (isRecording) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(dataArray);

    const waveformData = Array.from(dataArray);
    const dominantFrequency = findDominantFrequency(waveformData);
    updateNeedle(dominantFrequency);
    updateFrequencyDisplay(dominantFrequency);
    updateInstruction(dominantFrequency, targetFrequency);
  }
  requestAnimationFrame(updateTuner);
}

function updateNeedle(frequency) {
  const minFrequency = 200;
  const maxFrequency = 500;
  const needlePosition = ((frequency - minFrequency) / (maxFrequency - minFrequency)) * 100;
  needle.style.width = `${needlePosition}%`;
}

function updateFrequencyDisplay(frequency) {
  currentFrequency = frequency;
  frequencyDisplay.textContent = `${frequency.toFixed(1)} Hz`;
}

function updateInstruction(currentFrequency, targetFrequency) {
  if (currentFrequency < targetFrequency) {
    instruction.textContent = 'Tighten the string';
  } else if (currentFrequency > targetFrequency) {
    instruction.textContent = 'Loosen the string';
  } else {
    instruction.textContent = 'String is in tune!';
    isRecording = false;
    notes.forEach(note => note.classList.remove('active'));
  }
}

function findDominantFrequency(waveformData) {
  const fft = new FFT(FFT_SIZE);
  fft.forward(waveformData);

  // Find the peak frequency
  let peakFrequency = 0;
  let peakAmplitude = 0;
  for (let i = 0; i < FFT_SIZE / 2; i++) {
    const frequency = audioContext.sampleRate * i / FFT_SIZE;
    const amplitude = Math.abs(fft.spectrum[i]);
    if (amplitude > peakAmplitude) {
      peakAmplitude = amplitude;
      peakFrequency = frequency;
    }
  }
  return peakFrequency;
}

function playNote(frequency) {
  const duration = 1000; // Duration of the note in milliseconds

  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine'; // You can change the oscillator type if needed
  oscillator.frequency.value = frequency;

  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Start the oscillator
  oscillator.start();

  // Fade out the note after the duration
  gainNode.gain.setValueAtTime(1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

  // Stop the oscillator after the duration
  setTimeout(() => {
    oscillator.stop();
  }, duration);
}
