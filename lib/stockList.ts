export const DEFAULT_TICKERS = [
  // Mega Cap Tech
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
  // Semiconductors
  'AVGO', 'AMD', 'INTC', 'QCOM', 'MU', 'AMAT', 'LRCX', 'KLAC', 'MRVL', 'TXN', 'ARM', 'SMCI',
  // Software & Cloud
  'ORCL', 'ADBE', 'CRM', 'NFLX', 'NOW', 'WDAY', 'SNOW', 'DDOG', 'NET', 'PANW', 'CRWD', 'PLTR',
  // Tech — Hardware & Other
  'CSCO', 'IBM', 'UBER', 'COIN', 'DELL', 'HPQ', 'SPOT', 'TTD',
  // Cybersecurity
  'ZS', 'OKTA', 'FTNT',
  // Finance — Banks & Capital Markets
  'JPM', 'BAC', 'V', 'MA', 'GS', 'WFC', 'C', 'AXP', 'MS', 'SCHW', 'BLK', 'PYPL', 'COF', 'BX',
  // Finance — Other
  'BRK-B', 'SPGI', 'MCO', 'CME', 'ICE',
  // Healthcare — Pharma & Biotech
  'UNH', 'JNJ', 'PFE', 'ABBV', 'LLY', 'MRK', 'ABT', 'TMO', 'AMGN', 'BMY', 'GILD', 'VRTX', 'ISRG', 'MDT',
  // Healthcare — Insurance & Other
  'REGN', 'DXCM', 'CVS', 'CI', 'HUM',
  // Consumer & Retail
  'HD', 'COST', 'WMT', 'NKE', 'DIS', 'KO', 'PEP', 'MCD', 'SBUX', 'TGT', 'LOW', 'TJX', 'LULU', 'ABNB', 'BKNG',
  // Consumer — Autos & Misc
  'GM', 'F', 'EBAY', 'ETSY',
  // Industrials
  'BA', 'CAT', 'DE', 'HON', 'GE', 'LMT', 'UPS', 'FDX', 'MMM', 'RTX',
  // Transportation & Logistics
  'CSX', 'UNP', 'DAL',
  // Energy
  'XOM', 'CVX', 'COP', 'OXY', 'SLB', 'EOG', 'MPC', 'VLO',
  // International ADRs
  'TSM', 'BABA', 'NVO', 'ASML', 'SHOP', 'MELI',
  // ETFs — Broad Market
  'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'SCHD',
  // ETFs — Sector & Thematic
  'XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'ARKK', 'GLD', 'TLT', 'HYG', 'SOXX',
]

export const COMPANY_NAMES: Record<string, string> = {
  // Mega Cap Tech
  AAPL: 'Apple',         MSFT: 'Microsoft',    GOOGL: 'Alphabet',
  AMZN: 'Amazon',        NVDA: 'NVIDIA',        META: 'Meta',
  TSLA: 'Tesla',
  // Semiconductors
  AVGO: 'Broadcom',      AMD: 'AMD',            INTC: 'Intel',
  QCOM: 'Qualcomm',      MU: 'Micron',          AMAT: 'Applied Materials',
  LRCX: 'Lam Research',  KLAC: 'KLA Corp',      MRVL: 'Marvell',
  TXN: 'Texas Instruments', ARM: 'Arm Holdings', SMCI: 'Super Micro',
  // Software & Cloud
  ORCL: 'Oracle',        ADBE: 'Adobe',         CRM: 'Salesforce',
  NFLX: 'Netflix',       NOW: 'ServiceNow',     WDAY: 'Workday',
  SNOW: 'Snowflake',     DDOG: 'Datadog',       NET: 'Cloudflare',
  PANW: 'Palo Alto',     CRWD: 'CrowdStrike',   PLTR: 'Palantir',
  // Tech — Hardware & Other
  CSCO: 'Cisco',         IBM: 'IBM',            UBER: 'Uber',
  COIN: 'Coinbase',      DELL: 'Dell',          HPQ: 'HP Inc.',
  SPOT: 'Spotify',       TTD: 'The Trade Desk',
  // Cybersecurity
  ZS: 'Zscaler',         OKTA: 'Okta',          FTNT: 'Fortinet',
  // Finance
  JPM: 'JPMorgan Chase', BAC: 'Bank of America', V: 'Visa',
  MA: 'Mastercard',      GS: 'Goldman Sachs',   WFC: 'Wells Fargo',
  C: 'Citigroup',        AXP: 'Amex',           MS: 'Morgan Stanley',
  SCHW: 'Schwab',        BLK: 'BlackRock',      PYPL: 'PayPal',
  COF: 'Capital One',    BX: 'Blackstone',
  'BRK-B': 'Berkshire B', SPGI: 'S&P Global',  MCO: "Moody's",
  CME: 'CME Group',      ICE: 'ICE',
  // Healthcare
  UNH: 'UnitedHealth',   JNJ: 'J&J',            PFE: 'Pfizer',
  ABBV: 'AbbVie',        LLY: 'Eli Lilly',      MRK: 'Merck',
  ABT: 'Abbott',         TMO: 'Thermo Fisher',  AMGN: 'Amgen',
  BMY: 'Bristol-Myers',  GILD: 'Gilead',        VRTX: 'Vertex',
  ISRG: 'Intuitive',     MDT: 'Medtronic',
  REGN: 'Regeneron',     DXCM: 'DexCom',        CVS: 'CVS Health',
  CI: 'Cigna',           HUM: 'Humana',
  // Consumer & Retail
  HD: 'Home Depot',      COST: 'Costco',        WMT: 'Walmart',
  NKE: 'Nike',           DIS: 'Disney',         KO: 'Coca-Cola',
  PEP: 'PepsiCo',        MCD: "McDonald's",     SBUX: 'Starbucks',
  TGT: 'Target',         LOW: "Lowe's",         TJX: 'TJX Cos',
  LULU: 'Lululemon',     ABNB: 'Airbnb',        BKNG: 'Booking',
  GM: 'General Motors',  F: 'Ford',             EBAY: 'eBay',
  ETSY: 'Etsy',
  // Industrials & Transport
  BA: 'Boeing',          CAT: 'Caterpillar',    DE: 'Deere',
  HON: 'Honeywell',      GE: 'GE',              LMT: 'Lockheed Martin',
  UPS: 'UPS',            FDX: 'FedEx',          MMM: '3M',
  RTX: 'RTX',            CSX: 'CSX',            UNP: 'Union Pacific',
  DAL: 'Delta Air',
  // Energy
  XOM: 'ExxonMobil',     CVX: 'Chevron',        COP: 'ConocoPhillips',
  OXY: 'Occidental',     SLB: 'SLB',            EOG: 'EOG Resources',
  MPC: 'Marathon',       VLO: 'Valero',
  // International ADRs
  TSM: 'TSMC',           BABA: 'Alibaba',       NVO: 'Novo Nordisk',
  ASML: 'ASML',          SHOP: 'Shopify',       MELI: 'MercadoLibre',
  // ETFs
  SPY: 'S&P 500',        QQQ: 'Nasdaq 100',     IWM: 'Russell 2000',
  DIA: 'Dow Jones',      VTI: 'Total Market',   SCHD: 'Dividend ETF',
  XLF: 'Financials',     XLK: 'Technology',     XLE: 'Energy',
  XLV: 'Healthcare',     XLI: 'Industrials',    ARKK: 'ARK Innovation',
  GLD: 'Gold',           TLT: '20Y Treasury',   HYG: 'High Yield Bonds',
  SOXX: 'Semiconductors',
}

export const SECTOR_MAP: Record<string, string> = {
  AAPL: 'Tech',    MSFT: 'Tech',    GOOGL: 'Tech',  AMZN: 'Tech',
  NVDA: 'Tech',    META: 'Tech',    TSLA: 'Tech',   AVGO: 'Tech',
  AMD: 'Tech',     INTC: 'Tech',    QCOM: 'Tech',   MU: 'Tech',
  AMAT: 'Tech',    LRCX: 'Tech',    KLAC: 'Tech',   MRVL: 'Tech',
  TXN: 'Tech',     ARM: 'Tech',     SMCI: 'Tech',
  ORCL: 'Tech',    ADBE: 'Tech',    CRM: 'Tech',    NFLX: 'Tech',
  NOW: 'Tech',     WDAY: 'Tech',    SNOW: 'Tech',   DDOG: 'Tech',
  NET: 'Tech',     PANW: 'Tech',    CRWD: 'Tech',   PLTR: 'Tech',
  CSCO: 'Tech',    IBM: 'Tech',     UBER: 'Tech',   COIN: 'Tech',
  DELL: 'Tech',    HPQ: 'Tech',     SPOT: 'Tech',   TTD: 'Tech',
  ZS: 'Tech',      OKTA: 'Tech',    FTNT: 'Tech',
  JPM: 'Finance',  BAC: 'Finance',  V: 'Finance',   MA: 'Finance',
  GS: 'Finance',   WFC: 'Finance',  C: 'Finance',   AXP: 'Finance',
  MS: 'Finance',   SCHW: 'Finance', BLK: 'Finance', PYPL: 'Finance',
  COF: 'Finance',  BX: 'Finance',   'BRK-B': 'Finance',
  SPGI: 'Finance', MCO: 'Finance',  CME: 'Finance', ICE: 'Finance',
  UNH: 'Health',   JNJ: 'Health',   PFE: 'Health',  ABBV: 'Health',
  LLY: 'Health',   MRK: 'Health',   ABT: 'Health',  TMO: 'Health',
  AMGN: 'Health',  BMY: 'Health',   GILD: 'Health', VRTX: 'Health',
  ISRG: 'Health',  MDT: 'Health',   REGN: 'Health', DXCM: 'Health',
  CVS: 'Health',   CI: 'Health',    HUM: 'Health',
  HD: 'Consumer',  COST: 'Consumer', WMT: 'Consumer', NKE: 'Consumer',
  DIS: 'Consumer', KO: 'Consumer',  PEP: 'Consumer', MCD: 'Consumer',
  SBUX: 'Consumer', TGT: 'Consumer', LOW: 'Consumer', TJX: 'Consumer',
  LULU: 'Consumer', ABNB: 'Consumer', BKNG: 'Consumer',
  GM: 'Consumer',  F: 'Consumer',   EBAY: 'Consumer', ETSY: 'Consumer',
  BA: 'Industrial', CAT: 'Industrial', DE: 'Industrial', HON: 'Industrial',
  GE: 'Industrial', LMT: 'Industrial', UPS: 'Industrial', FDX: 'Industrial',
  MMM: 'Industrial', RTX: 'Industrial',
  CSX: 'Transport', UNP: 'Transport', DAL: 'Transport',
  XOM: 'Energy',   CVX: 'Energy',   COP: 'Energy',  OXY: 'Energy',
  SLB: 'Energy',   EOG: 'Energy',   MPC: 'Energy',  VLO: 'Energy',
  TSM: 'Intl',     BABA: 'Intl',    NVO: 'Intl',    ASML: 'Intl',
  SHOP: 'Intl',    MELI: 'Intl',
  SPY: 'ETF',      QQQ: 'ETF',      IWM: 'ETF',     DIA: 'ETF',
  VTI: 'ETF',      SCHD: 'ETF',     XLF: 'ETF',     XLK: 'ETF',
  XLE: 'ETF',      XLV: 'ETF',      XLI: 'ETF',     ARKK: 'ETF',
  GLD: 'ETF',      TLT: 'ETF',      HYG: 'ETF',     SOXX: 'ETF',
}
