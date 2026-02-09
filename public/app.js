// Trading Experiment Dashboard - Main App Logic
// Replace these with your actual Supabase credentials after setup
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const START_VALUE = 62771.86;
let livePrices = {};
let positions = { wiebe: {}, claude: {} };
let portfolioChart = null;

// Initialize app
async function init() {
    await loadPositions();
    await fetchLivePrices();
    await loadTrades();
    
    // Refresh prices every 60 seconds
    setInterval(fetchLivePrices, 60000);
}

// Load current positions from Supabase
async function loadPositions() {
    try {
        const { data, error } = await supabase
            .from('positions')
            .select('*');
        
        if (error) throw error;
        
        data.forEach(pos => {
            positions[pos.trader][pos.ticker] = pos.quantity;
        });
        
        console.log('Positions loaded:', positions);
    } catch (error) {
        console.error('Error loading positions:', error);
    }
}

// Fetch live prices from Supabase Edge Function
async function fetchLivePrices() {
    try {
        // Call Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('fetch-prices');
        
        if (error) throw error;
        
        livePrices = data.prices;
        
        // Save to price_history table
        const priceRecords = Object.entries(livePrices).map(([ticker, price]) => ({
            ticker,
            price,
            timestamp: new Date().toISOString()
        }));
        
        await supabase.from('price_history').insert(priceRecords);
        
        updateUI();
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch (error) {
        console.error('Error fetching prices:', error);
        document.getElementById('last-update').textContent = 'Error loading prices';
    }
}

// Load trades from database
async function loadTrades() {
    try {
        const { data, error } = await supabase
            .from('trades')
            .select('*')
            .order('date', { ascending: false })
            .order('time', { ascending: false });
        
        if (error) throw error;
        
        const tradeLog = document.getElementById('trade-log');
        tradeLog.innerHTML = '';
        
        data.forEach(trade => {
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
        const wiebeCount = data.filter(t => t.trader === 'wiebe').length;
        const claudeCount = data.filter(t => t.trader === 'claude').length;
        document.getElementById('wiebe-trades').textContent = wiebeCount;
        document.getElementById('claude-trades').textContent = claudeCount;
    } catch (error) {
        console.error('Error loading trades:', error);
    }
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
            labels: ['Start', 'Current'],
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
