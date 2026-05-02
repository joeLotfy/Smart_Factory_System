async function loadTodayEntries() {
    const res = await fetch('/api/reports/today');
    const data = await res.json();

    const list = document.getElementById('entriesList');
    list.innerHTML = '';

    data.entries.forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>[${entry.time}]</strong>
            ${entry.text}
            <button onclick="deleteEntry('${entry._id}')">Delete</button>
        `;
        list.appendChild(li);
    });
}

async function deleteEntry(entryId) {
    await fetch(`/api/reports/delete/${entryId}`, {
        method: 'DELETE'
    });

    loadTodayEntries();
}

document.getElementById('saveReport').addEventListener('click', async () => {
    const textArea = document.getElementById('reportText');
    const text = textArea.value.trim();
    if (!text) return;

    await fetch('/api/reports/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });

    textArea.value = '';
    loadTodayEntries();
});

// Load entries when page opens
window.onload = loadTodayEntries;