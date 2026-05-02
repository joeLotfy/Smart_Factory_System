async function loadMonthlyChart() {

    const response = await fetch('/api/analytics/monthly');
    const data = await response.json();

    console.log("Analytics data:", data);

    const labels = [];
    const avgTemps = [];
    const avgHums = [];

    const highTempPoints = [];
    const lowTempPoints = [];

    const highHumPoints = [];
    const lowHumPoints = [];

    data.forEach(day => {

        // Proper date label
        const dateLabel = `${day._id.day}/${day._id.month}`;
        labels.push(dateLabel);

        const temp = Number(day.avgTemp);
        const hum = Number(day.avgHum);

        avgTemps.push(temp);
        avgHums.push(hum);

        // Temperature alerts
        highTempPoints.push(temp > 30 ? temp : null);
        lowTempPoints.push(temp < 15 ? temp : null);

        // Humidity alerts
        highHumPoints.push(hum > 70 ? hum : null);
        lowHumPoints.push(hum < 25 ? hum : null);
    });

    const ctx = document.getElementById('monthlyChart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [

                {
                    label: 'Avg Temperature (°C)',
                    data: avgTemps,
                    borderColor: 'red',
                    tension: 0.3
                },

                {
                    label: 'Avg Humidity (%)',
                    data: avgHums,
                    borderColor: 'blue',
                    tension: 0.3
                },

                // High temperature markers
                {
                    label: 'Temp > 30°C',
                    data: highTempPoints,
                    backgroundColor: 'orange',
                    borderColor: 'orange',
                    pointRadius: 6,
                    showLine: false
                },

                // Low temperature markers
                {
                    label: 'Temp < 15°C',
                    data: lowTempPoints,
                    backgroundColor: 'purple',
                    borderColor: 'purple',
                    pointRadius: 6,
                    showLine: false
                },

                // High humidity markers
                {
                    label: 'Humidity > 70%',
                    data: highHumPoints,
                    backgroundColor: 'green',
                    borderColor: 'green',
                    pointRadius: 6,
                    showLine: false
                },

                // Low humidity markers
                {
                    label: 'Humidity < 25%',
                    data: lowHumPoints,
                    backgroundColor: 'brown',
                    borderColor: 'brown',
                    pointRadius: 6,
                    showLine: false
                }

            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,         
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

async function loadMQ2Chart() {

    const response = await fetch('/api/analytics/mq2');
    const data = await response.json();

    const labels = [];
    const avgGas = [];
    const spikePoints = [];

    data.forEach(day => {

        const label = `${day._id.day}/${day._id.month}`;
        labels.push(label);

        const avg = Number(day.avgGas);
        avgGas.push(avg);

        // Highlight if any reading > 1800
        spikePoints.push(day.maxGas > 1800 ? avg : null);
    });

    const ctx = document.getElementById('mq2Chart').getContext('2d');

    new Chart(ctx, {
        type: 'line', // area chart = line + fill
        data: {
            labels: labels,
            datasets: [

                {
                    label: 'MQ-2 Daily Average',
                    data: avgGas,
                    borderColor: 'green',
                    backgroundColor: 'rgba(0, 128, 0, 0.3)',
                    fill: true,
                    tension: 0.3
                },

                {
                    label: 'Gas Spike (>1800)',
                    data: spikePoints,
                    backgroundColor: 'red',
                    borderColor: 'red',
                    pointRadius: 7,
                    pointHoverRadius: 9,
                    showLine: false
                }

            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    ticks: { color: '#ccc' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    beginAtZero: false,
                    ticks: { color: '#ccc' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
}

async function loadKPIs(){
    const res = await fetch('/api/analytics/kpis');
    const data = await res.json();

    if(!data) return;

    //max temperature
    if(data.maxTemp){
        document.getElementById('maxTempValue').textContent = data.maxTemp.value.toFixed(2) + " °C";

        document.getElementById('maxTempDate').textContent = formatDate(data.maxTemp.date);
    }

    //max gas
    if(data.maxGas){
        document.getElementById('maxGasValue').textContent = data.maxGas.value;

        document.getElementById('maxGasDate').textContent = formatDate(data.maxGas.date);
    }

    //motion
    document.getElementById('motionTotalValue').textContent = data.motionTotal;
    document.getElementById('motionStartDate').textContent = "Since " + formatDate(data.aggregationStartDate);
}

function formatDate(dateString){
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB');       //  dd/mm/yyyy
}

window.onload = () => {         //load everything
    loadKPIs();
    loadMonthlyChart();
    loadMQ2Chart();
};