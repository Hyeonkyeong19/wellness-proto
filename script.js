const appState = {
    trainings: [],
    meals: []
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// Navigation buttons
document.getElementById('go-training').onclick = () => {
    startCamera();
    showScreen('training-screen');
};

document.getElementById('go-meal').onclick = () => {
    showScreen('meal-screen');
};

document.getElementById('back-home').onclick = () => {
    showScreen('home-screen');
};

// Training
let camera, pose;
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.poseLandmarks) {
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
            {color: '#00FF00', lineWidth: 4});
        drawLandmarks(canvasCtx, results.poseLandmarks,
            {color: '#FF0000', lineWidth: 2});
    }
    canvasCtx.restore();
}

function startCamera() {
    pose = new Pose({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }});
    pose.setOptions({modelComplexity: 0, smoothLandmarks: true});
    pose.onResults(onResults);

    camera = new Camera(videoElement, {
        onFrame: async () => {
            await pose.send({image: videoElement});
        },
        width: 640,
        height: 480
    });
    camera.start();
}

function stopCamera() {
    if (camera) {
        camera.stop();
    }
}

document.getElementById('end-training').onclick = () => {
    stopCamera();
    const result = {date: new Date().toLocaleString(), summary: 'ワークアウト記録'};
    appState.trainings.push(result);
    document.getElementById('result-date').textContent = result.date;
    document.getElementById('result-summary').textContent = result.summary;
    showScreen('result-screen');
};

// Save training result

document.getElementById('save-result').onclick = () => {
    updateChart();
    updateAdvice();
    showScreen('home-screen');
};

// Meal screen logic

document.getElementById('meal-image').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const resultDiv = document.getElementById('meal-result');
    resultDiv.textContent = '解析中...';
    // TODO: call actual API to analyze image
    setTimeout(() => {
        const mock = {protein: 10, fat: 5, carb: 20, calorie: 200};
        appState.meals.push({date: new Date().toLocaleString(), ...mock});
        resultDiv.textContent = `P:${mock.protein} F:${mock.fat} C:${mock.carb} Cal:${mock.calorie}`;
        updateChart();
        updateAdvice();
    }, 1000);
};

function updateChart() {
    const labels = appState.trainings.map(t => t.date);
    const data = appState.meals.map(m => m.calorie);
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

function updateAdvice() {
    const advice = `これまでの記録から、バランスの良い食事と運動を続けましょう！`;
    document.getElementById('ai-advice').textContent = advice;
}

// Setup chart
const ctx = document.getElementById('dataChart');
const chart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'カロリー',
            data: [],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {beginAtZero: true}
        }
    }
});

updateAdvice();
