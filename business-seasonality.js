const STORAGE_KEY = 'seasonality-factors-v1';

const defaultSeasonality = {
    1: 0.8,
    2: 0.85,
    3: 1.0,
    4: 1.1,
    5: 1.2,
    6: 1.3,
    7: 1.25,
    8: 1.15,
    9: 1.0,
    10: 0.95,
    11: 1.1,
    12: 1.5
};

const monthNames = {
    1: 'January',
    2: 'February',
    3: 'March',
    4: 'April',
    5: 'May',
    6: 'June',
    7: 'July',
    8: 'August',
    9: 'September',
    10: 'October',
    11: 'November',
    12: 'December'
};

document.addEventListener('DOMContentLoaded', () => {
    const initial = loadCoefficients();
    renderCoefficientInputs(initial);
    document.getElementById('calculate').addEventListener('click', calculate);
    document.getElementById('edit-coefficients').addEventListener('click', toggleCoefficients);
    document.getElementById('export-btn').addEventListener('click', exportsettings);
    document.getElementById('import-btn').addEventListener('change', importsettings);
    document.getElementById('reset-btn').addEventListener('click', resetToDefaults);
    enableAutosave();
});

function renderCoefficientInputs(factors) {
    const container = document.getElementById('coefficients-fields');
    container.innerHTML = '';

    Object.keys(monthNames).forEach((monthKey) => {
        const month = Number(monthKey);

        const wrapper = document.createElement('div');
        wrapper.className = 'coefficient-row';

        const label = document.createElement('label');
        label.textContent = monthNames[month] + ':';
        label.htmlFor = 'coeff-' + month;

        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'coeff-' + month;
        input.dataset.month = month;
        input.step = '0.01';
        input.min = '0';
        input.value = factors[month];

        wrapper.appendChild(label);
        wrapper.appendChild(input);
        container.appendChild(wrapper);
    });
}

function toggleCoefficients() {
    const container = document.getElementById('coefficients-container');
    const isHidden = container.style.display === 'none' || container.style.display === '';
    container.style.display = isHidden ? 'block' : 'none';
}

function calculate() {
    const annualDemand = parseFloat(document.getElementById('annual-demand').value);
    const month = Number(document.getElementById('month').value);

    const validationMessage = validateAnnualDemand(annualDemand);
    if (validationMessage) {
        document.getElementById('result').textContent = validationMessage;
        return;
    }

    const factors = getCurrentCoefficients();
    const seasonalityFactor = factors[month] || defaultSeasonality[month];
    const monthlyDemand = (annualDemand / 12) * seasonalityFactor;

    document.getElementById('result').textContent = 'Forecast for ' + monthNames[month] + ': ' + monthlyDemand.toFixed(2);
}

function getCurrentCoefficients() {
    const inputs = document.querySelectorAll('#coefficients-fields input');
    const coeffs = {};
    inputs.forEach(input => {
        const month = input.dataset.month;
        const value = parseFloat(input.value);
        const safeValue = Number.isNaN(value) || value < 0 ? defaultSeasonality[month] : value;
        coeffs[month] = safeValue;
    });
    return coeffs;
}

function setCurrentCoefficients(coeffs) {
    const inputs = document.querySelectorAll('#coefficients-fields input');
    inputs.forEach(input => {
        const month = input.dataset.month;
        if (coeffs[month] !== undefined) {
            input.value = coeffs[month];
        }
    });
}

function exportsettings() {
    const seasonalityFactors = getCurrentCoefficients();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(seasonalityFactors, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'seasonality_factors.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importsettings(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            setCurrentCoefficients(importedData);
            saveCoefficients(importedData);
            alert('Seasonality factors imported successfully!');
        } catch (error) {
            alert('Could not import settings. Please provide a valid JSON file.');
        }
    };
    reader.readAsText(file);
}

function enableAutosave() {
    const inputs = document.querySelectorAll('#coefficients-fields input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const coeffs = getCurrentCoefficients();
            saveCoefficients(coeffs);
        });
    });
}

function saveCoefficients(coeffs) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(coeffs));
    } catch (error) {
        console.warn('Could not save coefficients', error);
    }
}

function loadCoefficients() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return defaultSeasonality;
        }
        const parsed = JSON.parse(raw);
        return Object.keys(defaultSeasonality).reduce((acc, key) => {
            const value = parseFloat(parsed[key]);
            acc[key] = Number.isNaN(value) || value < 0 ? defaultSeasonality[key] : value;
            return acc;
        }, {});
    } catch (error) {
        return defaultSeasonality;
    }
}

function resetToDefaults() {
    setCurrentCoefficients(defaultSeasonality);
    saveCoefficients(defaultSeasonality);
    alert('Coefficients reset to defaults.');
}

function validateAnnualDemand(value) {
    if (Number.isNaN(value) || value <= 0) {
        return 'Enter annual demand greater than 0 to calculate.';
    }
    return '';
}