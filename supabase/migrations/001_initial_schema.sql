-- Trading experiment schema

-- Price history table
CREATE TABLE price_history (
    id BIGSERIAL PRIMARY KEY,
    ticker TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_ticker_timestamp UNIQUE (ticker, timestamp)
);

CREATE INDEX idx_price_history_ticker ON price_history(ticker);
CREATE INDEX idx_price_history_timestamp ON price_history(timestamp DESC);

-- Trades table
CREATE TABLE trades (
    id BIGSERIAL PRIMARY KEY,
    trader TEXT NOT NULL CHECK (trader IN ('wiebe', 'claude')),
    date DATE NOT NULL,
    time TIME,
    action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')),
    ticker TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    commission NUMERIC(10, 2) DEFAULT 0,
    net_amount NUMERIC(10, 2),
    rationale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trades_trader ON trades(trader);
CREATE INDEX idx_trades_date ON trades(date DESC);

-- Positions table (current holdings)
CREATE TABLE positions (
    id BIGSERIAL PRIMARY KEY,
    trader TEXT NOT NULL CHECK (trader IN ('wiebe', 'claude')),
    ticker TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_trader_ticker UNIQUE (trader, ticker)
);

CREATE INDEX idx_positions_trader ON positions(trader);

-- Insert initial positions (Feb 9, 2026)
INSERT INTO positions (trader, ticker, quantity) VALUES
    ('wiebe', 'AMD', 133),
    ('wiebe', 'GOOGL', 35),
    ('wiebe', 'AMZN', 25),
    ('wiebe', 'PLTR', 15),
    ('wiebe', 'BOTZ', 350),
    ('wiebe', 'IWDA', 25),
    ('wiebe', 'AIAI', 175),
    ('wiebe', 'CASH', 10749.07),
    ('claude', 'AMD', 183),
    ('claude', 'GOOGL', 35),
    ('claude', 'AMZN', 25),
    ('claude', 'PLTR', 15),
    ('claude', 'BOTZ', 350),
    ('claude', 'IWDA', 25),
    ('claude', 'AIAI', 175),
    ('claude', 'CASH', 0);

-- Insert initial trade
INSERT INTO trades (trader, date, time, action, ticker, quantity, price, commission, net_amount, rationale) VALUES
    ('wiebe', '2026-02-09', '18:30:00', 'SELL', 'AMD', 50, 215.00, 0.93, 10749.07, 
     'Limit order executed at $215. Derisking AMD from 52.5% → 39.4%. Built $10.7k cash buffer (14.8%).');

-- Enable Row Level Security
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read access" ON price_history FOR SELECT USING (true);
CREATE POLICY "Public read access" ON trades FOR SELECT USING (true);
CREATE POLICY "Public read access" ON positions FOR SELECT USING (true);
