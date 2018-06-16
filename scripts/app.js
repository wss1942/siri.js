// Older browsers might not implement mediaDevices at all, so we set an empty object first
if (navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {};
}

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var voiceSelect = document.getElementById("voice");
var source;
var stream;

var mute = document.querySelector('.mute');

var analyser = audioCtx.createAnalyser();
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.85;

var distortion = audioCtx.createWaveShaper();
var gainNode = audioCtx.createGain();
var biquadFilter = audioCtx.createBiquadFilter();
var convolver = audioCtx.createConvolver();

function makeDistortionCurve(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for (; i < n_samples; ++i) {
    x = i * 2 / n_samples - 1;
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
  }
  return curve;
};

// grab audio track via XHR for convolver node

var soundSource, concertHallBuffer;

var canvas = document.querySelector('.visualizer');
var canvasCtx = canvas.getContext("2d");

var intendedWidth = document.querySelector('.wrapper').clientWidth;

canvas.setAttribute('width', intendedWidth);

var visualSelect = document.getElementById("visual");

var drawVisual;

// var audioData = new Audio('./scripts/忘记拥抱.aac');
var audioData = document.querySelector("#audio");
// audioCtx.createMediaElementSource(audioData);
var source = audioCtx.createMediaElementSource(audioData);
source.connect(analyser);
analyser.connect(distortion);
distortion.connect(biquadFilter);
biquadFilter.connect(convolver);
convolver.connect(gainNode);
gainNode.connect(audioCtx.destination);

visualize();
voiceChange();

function visualize() {
  WIDTH = canvas.width;
  HEIGHT = canvas.height;


  var visualSetting = visualSelect.value;
  console.log(visualSetting);

  if (visualSetting === "sinewave") {
    analyser.fftSize = 2048;
    var bufferLength = analyser.fftSize;
    console.log(bufferLength);
    var dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    var draw = function () {

      drawVisual = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'rgb(200, 200, 200)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

      canvasCtx.beginPath();

      var sliceWidth = WIDTH * 1.0 / bufferLength;
      var x = 0;

      for (var i = 0; i < bufferLength; i++) {

        var v = dataArray[i] / 128.0;
        var y = v * HEIGHT / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();

  } else if (visualSetting == "frequencybars") {
    analyser.fftSize = 256;
    var bufferLengthAlt = analyser.frequencyBinCount;
    console.log(bufferLengthAlt);
    var dataArrayAlt = new Uint8Array(bufferLengthAlt);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    var drawAlt = function () {
      drawVisual = requestAnimationFrame(drawAlt);

      analyser.getByteFrequencyData(dataArrayAlt);

      canvasCtx.fillStyle = 'rgb(0, 0, 0)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      var barWidth = (WIDTH / bufferLengthAlt) * 2.5;
      var barHeight;
      var x = 0;

      for (var i = 0; i < bufferLengthAlt; i++) {
        barHeight = dataArrayAlt[i];

        canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
        canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

        x += barWidth + 1;
      }
    };

    drawAlt();

  } else if (visualSetting == "off") {
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.fillStyle = "red";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  }

}

function voiceChange() {

  distortion.oversample = '4x';
  biquadFilter.gain.setTargetAtTime(0, audioCtx.currentTime, 0)
  convolver.buffer = undefined;

  var voiceSetting = voiceSelect.value;
  console.log(voiceSetting);

  if (voiceSetting == "distortion") {
    distortion.curve = makeDistortionCurve(400);
  } else if (voiceSetting == "convolver") {
    convolver.buffer = concertHallBuffer;
  } else if (voiceSetting == "biquad") {
    biquadFilter.type = "lowshelf";
    biquadFilter.frequency.setTargetAtTime(1000, audioCtx.currentTime, 0)
    biquadFilter.gain.setTargetAtTime(25, audioCtx.currentTime, 0)
  } else if (voiceSetting == "off") {
    console.log("Voice settings turned off");
  }

}

// event listeners to change visualize and voice settings

visualSelect.onchange = function () {
  window.cancelAnimationFrame(drawVisual);
  visualize();
};

voiceSelect.onchange = function () {
  voiceChange();
};

mute.onclick = voiceMute;

function voiceMute() {
  if (mute.id === "") {
    gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0)
    mute.id = "activated";
    mute.innerHTML = "Unmute";
  } else {
    gainNode.gain.setTargetAtTime(1, audioCtx.currentTime, 0)
    mute.id = "";
    mute.innerHTML = "Mute";
  }
}
