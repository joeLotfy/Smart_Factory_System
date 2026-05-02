let sensorData = [];

async function loadData() {
    try {
        sensorData = []; // reset table every refresh

        // ---------- DHT LIVE DATA ----------
        const dhtRes = await fetch('/api/live');
        const dht = await dhtRes.json();

        if (dht && dht.temperature !== null) {
            const dhtStatus =
                dht.temperature > 35 || dht.humidity > 70
                    ? 'alert'
                    : 'normal';

            sensorData.push({
                sensor: 'DHT11',
                value: `Temp: ${dht.temperature} °C, Hum: ${dht.humidity} %`,
                time: dht.timestamp
                    ? new Date(dht.timestamp).toLocaleString()
                    : '--',
                status: dhtStatus
            });
        }

        // ---------- PIR LIVE DATA ----------
        const pirRes = await fetch('/api/pir/live');
        const pir = await pirRes.json();

        if (pir && pir.timestamp) {
            sensorData.push({
                sensor: 'PIR',
                value: pir.motion === 1 ? 'Motion Detected' : 'No Motion',
                time: new Date(pir.timestamp).toLocaleString(),
                status: pir.motion === 1 ? 'alert' : 'normal'
            });
        }

        // ------------- MQ-2 -------------------
        const mq2Res = await fetch('/api/mq2/live');
        const mq2 = await mq2Res.json();

        if (mq2 && mq2.value !== null) {
            sensorData.push({
                sensor: 'MQ-2',
                value: mq2.value,
                time: mq2.timestamp
                    ? new Date(mq2.timestamp).toLocaleString()
                    : '--',
                status: mq2.status
            });
        }

        renderTable();          //must be called AFTER the reading of sensors are pushed to sensorData (above)
        checkAlerts();
        
    } catch (err) {
        console.error('Dashboard load error:', err);
    }
}

function renderTable() {
    const tbody = document.querySelector('#sensorTable tbody');

    console.log('✅ Rendering table, data:', sensorData);

    tbody.innerHTML = '';

    sensorData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.sensor}</td>
            <td>${item.value}</td>
            <td>${item.time}</td>
            <td class="${item.status}">
                ${item.status === 'alert' ? 'ALERT' : 'NORMAL'}
            </td>
        `;
        tbody.appendChild(row);
    });
}


function checkAlerts() {
    const hasAlert = sampleData.some(item => item.status === 'alert');
    const alertsDiv = document.getElementById('alerts');
    if (hasAlert) {
        alertsDiv.classList.remove('hidden');
    } else {
        alertsDiv.classList.add('hidden');
    }
}
document.getElementById('refreshBtn').addEventListener('click', loadData);
window.onload = loadData;
setInterval(loadData, 3000);

/*************************
const translations = {
    ar: {
        dashboardTitle: 'لوحة تحكم المصنع الذكي',
        logoutLink: 'تسجيل الخروج',
        sensorDataTitle: 'بيانات المستشعرات الأخيرة',
        sensorType: 'نوع المستشعر',
        value: 'القيمة',
        time: 'الوقت',
        status: 'الحالة',
        refreshBtn: 'تحديث البيانات',
        alertExample: 'تنبيه: توجد حركة غير طبيعية بالمكان! (مثال)',
        langToggle: 'EN / عربي',
        statusAlert: 'تنبيه', 
        statusNormal: 'طبيعي' ,
        value500lux:'500 lux',
       
    },
    en: {
        dashboardTitle: 'Smart Factory Dashboard',
        logoutLink: 'Logout',
        sensorDataTitle: 'Recent Sensor Data',
        sensorType: 'Sensor Type',
        value: 'Value',
        time: 'Time',
        status: 'Status',
        refreshBtn: 'Refresh Data',
        alertExample: 'Alert: High Temperature! (Example)',
        langToggle: 'عربي / AR',
        statusAlert: 'Alert',
        statusNormal: 'Normal',
          value500lux:'مممممم',
       
    }
};
********************/

document.addEventListener('DOMContentLoaded', () => {
    const langButton = document.getElementById('lang-toggle');
    const htmlElement = document.querySelector('html'); 
    
    let currentLang = htmlElement.getAttribute('lang') || 'ar'; 

    function translateTableStatus(lang) {
        const t = translations[lang];
        
      
        document.querySelectorAll('.alert, .normal').forEach(cell => {
          
            if (cell.classList.contains('alert')) {
                cell.textContent = t.statusAlert;
            } else if (cell.classList.contains('normal')) {
                cell.textContent = t.statusNormal;
            }
        });
    }

    function updateContent(lang) {
        const translation = translations[lang];
        
        htmlElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        htmlElement.setAttribute('lang', lang);

        document.querySelectorAll('[data-key]').forEach(element => {
            const key = element.getAttribute('data-key');
            if (translation[key]) {
                element.textContent = translation[key];
            }
        });
        langButton.textContent = translation.langToggle;
        translateTableStatus(lang);
    }
    updateContent(currentLang);
    langButton.addEventListener('click', () => {
        currentLang = currentLang === 'ar' ? 'en' : 'ar';
        updateContent(currentLang);
    });
});
