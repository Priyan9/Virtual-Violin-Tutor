const notes = document.querySelectorAll('.note');
const needle = document.querySelector('.needle');
const frequencyDisplay = document.querySelector('.frequency-display');
const instruction = document.querySelector('.instruction');

let currentFrequency = 0;
let targetFrequency = 0;
let audioContext;
let analyser;
let isRecording = false;

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
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
  playNote(targetFrequency);
  instruction.textContent = 'Play the string and tune it';
  isRecording = true;
}

function updateTuner() {
  if (isRecording) {
    analyser.getFloatTimeDomainData(waveformData);
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
  const zerocrossings = [];
  let previousValue = 0;
  let dominantFrequency = 0;

  for (let i = 0; i < waveformData.length; i++) {
    if ((previousValue * waveformData[i]) < 0) {
      zerocrossings.push(i);
    }
    previousValue = waveformData[i];
  }

  if (zerocrossings.length > 1) {
    const timeBetweenZeroCrossings = (zerocrossings[1] - zerocrossings[0]) / analyser.fftSize;
    dominantFrequency = 1 / (2 * timeBetweenZeroCrossings);
  }

  return dominantFrequency;
}

function playNote(frequency) {
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  oscillator.connect(audioContext.destination);
  oscillator.start();
  setTimeout(() => {
    oscillator.stop();
  }, 1000);
}