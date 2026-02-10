// Trading Experiment Dashboard - Static Data Version
// Updated: Feb 10, 2026 with hardcoded prices

const START_VALUE = 62771.86;

// Hardcoded live prices (Feb 10, 2026)
const livePrices = {
    'AMD': 215.00,
    'GOOGL': 192.50,
    'AMZN': 226.80,
    'PLTR': 89.45,
    'BOTZ': 38.20,
    'IWDA': 112.80,
    'AIAI': 14.35
};

// Current positions
const positions = {
    wiebe: {
        'AMD': 133,
        'GOOGL': 35,
        'AMZN': 25,
        'PLTR': 15,
        'BOTZ': 350,
        'IWDA': 25,
        'AIAI': 175,
        'CASH': 10749.07
    },
    claude: {
        'AMD': 183,
        'GOOGL': 35,
        'AMZN': 25,
        'PLTR': 15,
        'BOTZ': 350,
        'IWDA': 25,
        'AIAI': 175,
        'CASH': 0
    }
};

// Trades history
const trades = [
    {
        trader: 'wiebe',
        date: '2026-02-09',
        time: '18:30:00',
        action: 'SELL',
        ticker: 'AMD',
        quantity: 50,
        price: 215.00,
        commission: 0.93,
        net_amount: 10749.07,
        rationale: 'Limit order executed at $215. Derisking AMD from 52.5% → 39.4%. Built $10.7k cash buffer (14.8%).'
    }
];

let portfolioChart = null;

// Initialize app
function init() {
    updateUI();
    loadTrades();
    document.getElementById('last-update').textContent = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Load trades
function loadTrades() {
    const tradeLog = document.getElementById('trade-log');
    tradeLog.innerHTML = '';
    
    trades.forEach(trade => {
        const div = document.createElement('div');
        div.className = `trade-item ${trade.trader}`;
        div.innerHTML = `
            <div class="trade-header">
                <div class="trade-action">
                    ${trade.trader === 'wiebe' ? '🧑' : '🤖'} ${trade.trader.charAt(0).toUpperCase() + trade.trader.slice(1)}: 
                    ${trade.action} ${trade.quantity} ${trade.ticker} @ $${trade.price.toFixed(2)}
                </div>
                <div class="trade-time">${trade.date} ${trade.time || ''}</div>
            </div>
            <div class="trade-details">
                Value: $${(trade.quantity * trade.price).toFixed(2)} | 
                Commission: $${trade.commission.toFixed(2)} | 
                Net: $${trade.net_amount.toFixed(2)}
            </div>
            ${trade.rationale ? `<div class="trade-rationale">${trade.rationale}</div>` : ''}
        `;
        tradeLog.appendChild(div);
    });
    
    // Update trade counts
    const wiebeCount = trades.filter(t => t.trader === 'wiebe').length;
    const claudeCount = trades.filter(t => t.trader === 'claude').length;
    document.getElementById('wiebe-trades').textContent = wiebeCount;
    document.getElementById('claude-trades').textContent = claudeCount;
}

// Update UI with latest data
function updateUI() {
    // Calculate portfolio values
    let wiebeValue = 0;
    let claudeValue = 0;
    
    Object.entries(positions.wiebe).forEach(([ticker, qty]) => {
        const price = ticker === 'CASH' ? 1 : (livePrices[ticker] || 0);
        wiebeValue += qty * price;
    });
    
    Object.entries(positions.claude).forEach(([ticker, qty]) => {
        const price = ticker === 'CASH' ? 1 : (livePrices[ticker] || 0);
        claudeValue += qty * price;
    });
    
    const wiebeReturn = wiebeValue - START_VALUE;
    const wiebeReturnPct = (wiebeReturn / START_VALUE) * 100;
    const claudeReturn = claudeValue - START_VALUE;
    const claudeReturnPct = (claudeReturn / START_VALUE) * 100;
    const gap = Math.abs(wiebeValue - claudeValue);
    const leader = wiebeValue > claudeValue ? 'Wiebe' : 'Claude';
    
    // Update stats
    document.getElementById('wiebe-value').textContent = formatCurrency(wiebeValue);
    document.getElementById('wiebe-return').textContent = 
        `${wiebeReturn >= 0 ? '+' : ''}${formatCurrency(wiebeReturn)} (${wiebeReturnPct >= 0 ? '+' : ''}${wiebeReturnPct.toFixed(2)}%)`;
    document.getElementById('claude-value').textContent = formatCurrency(claudeValue);
    document.getElementById('claude-return').textContent = 
        `${claudeReturn >= 0 ? '+' : ''}${formatCurrency(claudeReturn)} (${claudeReturnPct >= 0 ? '+' : ''}${claudeReturnPct.toFixed(2)}%)`;
    document.getElementById('gap-value').textContent = formatCurrency(gap);
    document.getElementById('gap-leader').textContent = `${leader} ahead`;
    
    updateChart(wiebeValue, claudeValue);
    updatePositions('wiebe', wiebeValue);
    updatePositions('claude', claudeValue);
}

// Update chart
function updateChart(wiebeValue, claudeValue) {
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    
    if (portfolioChart) portfolioChart.destroy();
    
    portfolioChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Start (Feb 9)', 'Current (Feb 10)'],
            datasets: [
                {
                    label: 'Wiebe',
                    data: [START_VALUE, wiebeValue],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: '#f59e0b'
                },
                {
                    label: 'Claude',
                    data: [START_VALUE, claudeValue],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: '#10b981'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#e8e9ed',
                        font: { size: 14, weight: '700', family: 'Satoshi' },
                        padding: 20
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#8b8d98',
                        font: { family: 'Satoshi', weight: '600' },
                        callback: (v) => '$' + (v/1000).toFixed(0) + 'k'
                    },
                    grid: { color: '#2a2a32' }
                },
                x: {
                    ticks: {
                        color: '#8b8d98',
                        font: { family: 'Satoshi', weight: '600' }
                    },
                    grid: { color: '#2a2a32' }
                }
            }
        }
    });
}

// Update positions display
function updatePositions(trader, totalValue) {
    const container = document.getElementById(`${trader}-positions`);
    container.innerHTML = '';
    
    const positionsArray = Object.entries(positions[trader]).map(([ticker, qty]) => {
        const price = ticker === 'CASH' ? 1 : (livePrices[ticker] || 0);
        const value = qty * price;
        return { ticker, qty, price, value };
    });
    
    positionsArray.sort((a, b) => b.value - a.value);
    
    positionsArray.forEach(({ ticker, qty, price, value }) => {
        const pct = (value / totalValue * 100).toFixed(1);
        const div = document.createElement('div');
        div.className = 'position-item';
        div.innerHTML = `
            <div>
                <div class="position-name">${ticker}</div>
                <div class="position-qty">
                    ${ticker === 'CASH' ? formatCurrency(qty) : `${qty.toFixed(0)} @ ${formatCurrency(price)}`}
                </div>
            </div>
            <div>
                <div class="position-value">${formatCurrency(value)}</div>
                <div class="position-pct">${pct}%</div>
            </div>
        `;
        container.appendChild(div);
    });
}

// Format currency
function formatCurrency(value) {
    return '$' + value.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

// Start the app
init();
