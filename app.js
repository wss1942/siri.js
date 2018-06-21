// 设置canves
var canvas = document.querySelector('.visualizer');
var canvasCtx = canvas.getContext("2d");
var intendedWidth = document.querySelector('.wrapper').clientWidth;
canvas.setAttribute('width', intendedWidth);

// 获取音频数据
var audioData = document.querySelector("#audio");

// 音频api
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var source = audioCtx.createMediaElementSource(audioData);
var analyser = audioCtx.createAnalyser(); // 创建一个AnalyserNode，它可以用来显示音频时间和频率的数据
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.85;
source.connect(analyser);
analyser.connect(audioCtx.destination);

// analyser.fftSize = 256;一次返回的频率数据的个数
analyser.fftSize = 256;
// 固定为 AnalyserNode 接口中fftSize值的一半. 该属性通常用于可视化的数据值的数量.
var bufferLengthAlt = analyser.frequencyBinCount;
var dataArrayAlt = new Uint8Array(bufferLengthAlt);

WIDTH = canvas.width;
HEIGHT = canvas.height;
canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

var drawVisual;
var drawAlt = function () {
	// 动画帧，类似于setTimeout
	drawVisual = requestAnimationFrame(drawAlt);
	// 将当前频率数据复制到传入的Uint8Array（无符号字节数组）中
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

window.frequencyData = [];
window.addFrequencyData = function (dataArrayAlt) {
	var a = [1, 3, 5, 8, 13, 21, 34];
	var b = [];
	a.map(function (ii) {
		b.push(dataArrayAlt[ii]);
	})

	window.frequencyData.push(...b);
	console.log(b, window.frequencyData.length);
}
var SW9;
function draw() {
	drawVisual = requestAnimationFrame(draw);
	analyser.getByteFrequencyData(dataArrayAlt);
	window.addFrequencyData(dataArrayAlt);
	if(window.frequencyData.length===0){
		console.warn(-1)
		SW9.stop();
		cancelAnimationFrame(drawVisual);
	}
}

audioData.onplay = function () {
	analyser.getByteFrequencyData(dataArrayAlt);
	window.addFrequencyData(dataArrayAlt);
	SW9 = new SiriWave9({
		width: 259,
		height: 40,
		speed: 0.2,
		amplitude: 0.5,
		container: document.body,
		autostart: true,
	});
	draw();
}
audioData.onpause = function () {
	SW9.stop();
	cancelAnimationFrame(drawVisual);
}
