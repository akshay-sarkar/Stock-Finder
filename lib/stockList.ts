export const DEFAULT_TICKERS = [
  // ── Mega Cap Tech ──────────────────────────────────────────────────────────
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
  // ── Semiconductors ─────────────────────────────────────────────────────────
  'AVGO', 'AMD', 'INTC', 'QCOM', 'MU', 'AMAT', 'LRCX', 'KLAC', 'MRVL', 'TXN', 'ARM', 'SMCI',
  'SWKS', 'MCHP', 'MPWR', 'ON', 'STX', 'WDC',
  // ── Software & Cloud ───────────────────────────────────────────────────────
  'ORCL', 'ADBE', 'CRM', 'NFLX', 'NOW', 'WDAY', 'SNOW', 'DDOG', 'NET', 'PANW', 'CRWD', 'PLTR',
  'INTU', 'ADSK', 'CDNS', 'SNPS', 'HUBS', 'MDB', 'TWLO', 'ZM', 'DOCU', 'TEAM', 'PAYC', 'ZI', 'BILL',
  // ── Tech Hardware & Other ──────────────────────────────────────────────────
  'CSCO', 'IBM', 'UBER', 'COIN', 'DELL', 'HPQ', 'SPOT', 'TTD', 'APP', 'HPE', 'ANET', 'RBLX', 'MSTR',
  // ── Cybersecurity ──────────────────────────────────────────────────────────
  'ZS', 'OKTA', 'FTNT',
  // ── Social & Consumer Tech ─────────────────────────────────────────────────
  'SNAP', 'PINS', 'MTCH', 'DKNG',
  // ── Banks ──────────────────────────────────────────────────────────────────
  'JPM', 'BAC', 'WFC', 'C', 'MS', 'GS', 'SCHW', 'USB', 'PNC', 'TFC', 'COF', 'RF', 'HBAN', 'KEY', 'FITB',
  // ── Payments & Fintech ─────────────────────────────────────────────────────
  'V', 'MA', 'PYPL', 'AXP', 'SQ', 'AFRM', 'FISV', 'FIS', 'HOOD',
  // ── Asset Mgmt & Exchanges ────────────────────────────────────────────────
  'BLK', 'BX', 'BRK-B', 'KKR', 'APO', 'ARES', 'TROW', 'SPGI', 'MCO', 'CME', 'ICE', 'NDAQ', 'CBOE',
  // ── Insurance ──────────────────────────────────────────────────────────────
  'MET', 'PRU', 'AFL', 'CB', 'PGR', 'ALL',
  // ── Pharma & Biotech ───────────────────────────────────────────────────────
  'JNJ', 'PFE', 'ABBV', 'LLY', 'MRK', 'ABT', 'TMO', 'AMGN', 'BMY', 'GILD', 'VRTX',
  'REGN', 'MRNA', 'BIIB', 'ILMN', 'RPRX',
  // ── Medical Devices & Equipment ───────────────────────────────────────────
  'ISRG', 'MDT', 'BSX', 'SYK', 'EW', 'BDX', 'BAX', 'DXCM', 'DHR', 'A', 'IQV',
  'RMD', 'HOLX', 'PODD', 'ALGN', 'GEHC', 'ZBH', 'IDXX', 'STE',
  // ── Managed Care & Health Services ────────────────────────────────────────
  'UNH', 'CVS', 'CI', 'HUM', 'MOH', 'CNC', 'MCK', 'CAH',
  // ── Consumer Staples ───────────────────────────────────────────────────────
  'WMT', 'COST', 'KO', 'PEP', 'PG', 'MO', 'PM', 'CL', 'KR', 'CLX',
  // ── Restaurants ────────────────────────────────────────────────────────────
  'MCD', 'SBUX', 'YUM', 'CMG', 'DPZ',
  // ── Consumer Discretionary ────────────────────────────────────────────────
  'HD', 'NKE', 'DIS', 'TGT', 'LOW', 'TJX', 'LULU', 'ABNB', 'BKNG',
  'GM', 'F', 'EBAY', 'ETSY', 'BBY', 'DLTR', 'DG', 'TSCO', 'WSM', 'RH', 'ULTA',
  'MAR', 'HLT', 'RCL', 'CCL', 'EXPE', 'MGM', 'LVS', 'CZR',
  // ── Defense ────────────────────────────────────────────────────────────────
  'LMT', 'RTX', 'GD', 'NOC', 'LHX', 'HII',
  // ── Aerospace & Industrial Equipment ──────────────────────────────────────
  'BA', 'GE', 'HON', 'CAT', 'DE',
  // ── Industrial Automation & Components ────────────────────────────────────
  'EMR', 'ETN', 'ROK', 'AME', 'IR', 'PH', 'ITW', 'CARR', 'OTIS',
  // ── Industrial Services ────────────────────────────────────────────────────
  'UPS', 'FDX', 'WM', 'RSG', 'CTAS', 'FAST', 'GWW', 'PWR', 'AXON', 'VRSK', 'EFX', 'CPRT', 'BAH', 'LDOS', 'MMM',
  // ── Transportation ─────────────────────────────────────────────────────────
  'CSX', 'UNP', 'NSC', 'DAL', 'UAL', 'LUV', 'AAL', 'JBHT', 'CHRW', 'EXPD', 'SAIA',
  // ── Energy: Majors ─────────────────────────────────────────────────────────
  'XOM', 'CVX',
  // ── Energy: E&P ────────────────────────────────────────────────────────────
  'COP', 'OXY', 'EOG', 'DVN', 'FANG', 'HES', 'APA',
  // ── Energy: Services ───────────────────────────────────────────────────────
  'SLB', 'HAL', 'BKR',
  // ── Energy: Refining ───────────────────────────────────────────────────────
  'MPC', 'VLO', 'PSX',
  // ── Energy: Midstream ──────────────────────────────────────────────────────
  'WMB', 'KMI', 'OKE', 'LNG',
  // ── Utilities ──────────────────────────────────────────────────────────────
  'NEE', 'DUK', 'SO', 'CEG', 'SRE', 'D', 'EXC', 'AES',
  // ── Real Estate ────────────────────────────────────────────────────────────
  'PLD', 'AMT', 'CCI', 'EQIX', 'SPG', 'O', 'PSA', 'EXR', 'VICI', 'WELL', 'AVB', 'DLR',
  // ── Materials ──────────────────────────────────────────────────────────────
  'LIN', 'APD', 'ECL', 'NEM', 'FCX', 'NUE', 'DOW', 'SHW', 'ALB', 'DD', 'PPG',
  // ── Telecom & Media ────────────────────────────────────────────────────────
  'T', 'VZ', 'TMUS', 'CHTR', 'CMCSA',
  // ── China ADRs ─────────────────────────────────────────────────────────────
  'BABA', 'JD', 'PDD', 'BIDU', 'NIO', 'XPEV', 'LI', 'NTES', 'TME',
  'BILI', 'IQ', 'VIPS', 'TAL', 'EDU', 'FUTU', 'MNSO', 'YMM', 'BZ', 'QFIN', 'MOMO',
  // ── International ADRs ─────────────────────────────────────────────────────
  'TSM', 'NVO', 'ASML', 'SHOP', 'MELI',
  // ── ETFs: Broad Market ─────────────────────────────────────────────────────
  'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'SCHD',
  // ── ETFs: Sector & Thematic ────────────────────────────────────────────────
  'XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'ARKK', 'GLD', 'TLT', 'HYG', 'SOXX',
]

export const COMPANY_NAMES: Record<string, string> = {
  // Mega Cap Tech
  AAPL: 'Apple',              MSFT: 'Microsoft',          GOOGL: 'Alphabet',
  AMZN: 'Amazon',             NVDA: 'NVIDIA',             META: 'Meta',
  TSLA: 'Tesla',
  // Semiconductors
  AVGO: 'Broadcom',           AMD: 'AMD',                 INTC: 'Intel',
  QCOM: 'Qualcomm',           MU: 'Micron',               AMAT: 'Applied Materials',
  LRCX: 'Lam Research',       KLAC: 'KLA Corp',           MRVL: 'Marvell',
  TXN: 'Texas Instruments',   ARM: 'Arm Holdings',        SMCI: 'Super Micro',
  SWKS: 'Skyworks',           MCHP: 'Microchip Tech',     MPWR: 'Monolithic Power',
  ON: 'ON Semi',              STX: 'Seagate',             WDC: 'Western Digital',
  // Software & Cloud
  ORCL: 'Oracle',             ADBE: 'Adobe',              CRM: 'Salesforce',
  NFLX: 'Netflix',            NOW: 'ServiceNow',          WDAY: 'Workday',
  SNOW: 'Snowflake',          DDOG: 'Datadog',            NET: 'Cloudflare',
  PANW: 'Palo Alto',          CRWD: 'CrowdStrike',        PLTR: 'Palantir',
  INTU: 'Intuit',             ADSK: 'Autodesk',           CDNS: 'Cadence Design',
  SNPS: 'Synopsys',           HUBS: 'HubSpot',            MDB: 'MongoDB',
  TWLO: 'Twilio',             ZM: 'Zoom',                 DOCU: 'DocuSign',
  TEAM: 'Atlassian',          PAYC: 'Paycom',             ZI: 'ZoomInfo',
  BILL: 'Bill.com',
  // Tech Hardware & Other
  CSCO: 'Cisco',              IBM: 'IBM',                 UBER: 'Uber',
  COIN: 'Coinbase',           DELL: 'Dell',               HPQ: 'HP Inc.',
  SPOT: 'Spotify',            TTD: 'The Trade Desk',      APP: 'AppLovin',
  HPE: 'HP Enterprise',       ANET: 'Arista Networks',    RBLX: 'Roblox',
  MSTR: 'Strategy',
  // Cybersecurity
  ZS: 'Zscaler',              OKTA: 'Okta',               FTNT: 'Fortinet',
  // Social & Consumer Tech
  SNAP: 'Snap',               PINS: 'Pinterest',          MTCH: 'Match Group',
  DKNG: 'DraftKings',
  // Banks
  JPM: 'JPMorgan Chase',      BAC: 'Bank of America',     WFC: 'Wells Fargo',
  C: 'Citigroup',             MS: 'Morgan Stanley',       GS: 'Goldman Sachs',
  SCHW: 'Schwab',             USB: 'US Bancorp',          PNC: 'PNC Financial',
  TFC: 'Truist',              COF: 'Capital One',         RF: 'Regions Financial',
  HBAN: 'Huntington',         KEY: 'KeyCorp',             FITB: 'Fifth Third',
  // Payments & Fintech
  V: 'Visa',                  MA: 'Mastercard',           PYPL: 'PayPal',
  AXP: 'Amex',                SQ: 'Block',                AFRM: 'Affirm',
  FISV: 'Fiserv',             FIS: 'Fidelity NIS',        HOOD: 'Robinhood',
  // Asset Mgmt & Exchanges
  BLK: 'BlackRock',           BX: 'Blackstone',           'BRK-B': 'Berkshire B',
  KKR: 'KKR',                 APO: 'Apollo Global',       ARES: 'Ares Management',
  TROW: 'T. Rowe Price',      SPGI: 'S&P Global',         MCO: "Moody's",
  CME: 'CME Group',           ICE: 'ICE',                 NDAQ: 'Nasdaq Inc',
  CBOE: 'Cboe Global',
  // Insurance
  MET: 'MetLife',             PRU: 'Prudential',          AFL: 'Aflac',
  CB: 'Chubb',                PGR: 'Progressive',         ALL: 'Allstate',
  // Pharma & Biotech
  JNJ: 'J&J',                 PFE: 'Pfizer',              ABBV: 'AbbVie',
  LLY: 'Eli Lilly',           MRK: 'Merck',               ABT: 'Abbott',
  TMO: 'Thermo Fisher',       AMGN: 'Amgen',              BMY: 'Bristol-Myers',
  GILD: 'Gilead',             VRTX: 'Vertex',             REGN: 'Regeneron',
  MRNA: 'Moderna',            BIIB: 'Biogen',             ILMN: 'Illumina',
  RPRX: 'Royalty Pharma',
  // Medical Devices
  ISRG: 'Intuitive',          MDT: 'Medtronic',           BSX: 'Boston Scientific',
  SYK: 'Stryker',             EW: 'Edwards Lifesci.',     BDX: 'Becton Dickinson',
  BAX: 'Baxter',              DXCM: 'DexCom',             DHR: 'Danaher',
  A: 'Agilent',               IQV: 'IQVIA',               RMD: 'ResMed',
  HOLX: 'Hologic',            PODD: 'Insulet',            ALGN: 'Align Tech',
  GEHC: 'GE HealthCare',      ZBH: 'Zimmer Biomet',       IDXX: 'IDEXX Labs',
  STE: 'STERIS',
  // Managed Care & Health Services
  UNH: 'UnitedHealth',        CVS: 'CVS Health',          CI: 'Cigna',
  HUM: 'Humana',              MOH: 'Molina Healthcare',   CNC: 'Centene',
  MCK: 'McKesson',            CAH: 'Cardinal Health',
  // Consumer Staples
  WMT: 'Walmart',             COST: 'Costco',             KO: 'Coca-Cola',
  PEP: 'PepsiCo',             PG: 'Procter & Gamble',     MO: 'Altria',
  PM: 'Philip Morris',        CL: 'Colgate',              KR: 'Kroger',
  CLX: 'Clorox',
  // Restaurants
  MCD: "McDonald's",          SBUX: 'Starbucks',          YUM: 'Yum! Brands',
  CMG: 'Chipotle',            DPZ: "Domino's",
  // Consumer Discretionary
  HD: 'Home Depot',           NKE: 'Nike',                DIS: 'Disney',
  TGT: 'Target',              LOW: "Lowe's",              TJX: 'TJX Cos',
  LULU: 'Lululemon',          ABNB: 'Airbnb',             BKNG: 'Booking',
  GM: 'General Motors',       F: 'Ford',                  EBAY: 'eBay',
  ETSY: 'Etsy',               BBY: 'Best Buy',            DLTR: 'Dollar Tree',
  DG: 'Dollar General',       TSCO: 'Tractor Supply',     WSM: 'Williams-Sonoma',
  RH: 'RH',                   ULTA: 'Ulta Beauty',        MAR: 'Marriott',
  HLT: 'Hilton',              RCL: 'Royal Caribbean',     CCL: 'Carnival',
  EXPE: 'Expedia',            MGM: 'MGM Resorts',         LVS: 'Las Vegas Sands',
  CZR: 'Caesars',
  // Defense
  LMT: 'Lockheed Martin',     RTX: 'RTX',                 GD: 'General Dynamics',
  NOC: 'Northrop Grumman',    LHX: 'L3Harris',            HII: 'Huntington Ingalls',
  // Aerospace & Industrial Equipment
  BA: 'Boeing',               GE: 'GE',                   HON: 'Honeywell',
  CAT: 'Caterpillar',         DE: 'Deere',
  // Industrial Automation
  EMR: 'Emerson Electric',    ETN: 'Eaton',               ROK: 'Rockwell Automation',
  AME: 'AMETEK',              IR: 'Ingersoll Rand',       PH: 'Parker Hannifin',
  ITW: 'Illinois Tool Works', CARR: 'Carrier Global',     OTIS: 'Otis Worldwide',
  // Industrial Services
  UPS: 'UPS',                 FDX: 'FedEx',               WM: 'Waste Management',
  RSG: 'Republic Services',   CTAS: 'Cintas',             FAST: 'Fastenal',
  GWW: 'W.W. Grainger',       PWR: 'Quanta Services',     AXON: 'Axon Enterprise',
  VRSK: 'Verisk Analytics',   EFX: 'Equifax',             CPRT: 'Copart',
  BAH: 'Booz Allen',          LDOS: 'Leidos',             MMM: '3M',
  // Transportation
  CSX: 'CSX',                 UNP: 'Union Pacific',       NSC: 'Norfolk Southern',
  DAL: 'Delta Air',           UAL: 'United Airlines',     LUV: 'Southwest',
  AAL: 'American Airlines',   JBHT: 'JB Hunt',            CHRW: 'CH Robinson',
  EXPD: 'Expeditors',         SAIA: 'Saia',
  // Energy
  XOM: 'ExxonMobil',          CVX: 'Chevron',             COP: 'ConocoPhillips',
  OXY: 'Occidental',          EOG: 'EOG Resources',       DVN: 'Devon Energy',
  FANG: 'Diamondback',        HES: 'Hess',                APA: 'APA Corp',
  SLB: 'SLB',                 HAL: 'Halliburton',         BKR: 'Baker Hughes',
  MPC: 'Marathon',            VLO: 'Valero',              PSX: 'Phillips 66',
  WMB: 'Williams Cos',        KMI: 'Kinder Morgan',       OKE: 'ONEOK',
  LNG: 'Cheniere Energy',
  // Utilities
  NEE: 'NextEra Energy',      DUK: 'Duke Energy',         SO: 'Southern Company',
  CEG: 'Constellation Energy',SRE: 'Sempra',              D: 'Dominion Energy',
  EXC: 'Exelon',              AES: 'AES Corp',
  // Real Estate
  PLD: 'Prologis',            AMT: 'American Tower',      CCI: 'Crown Castle',
  EQIX: 'Equinix',            SPG: 'Simon Property',      O: 'Realty Income',
  PSA: 'Public Storage',      EXR: 'Extra Space',         VICI: 'VICI Properties',
  WELL: 'Welltower',          AVB: 'AvalonBay',           DLR: 'Digital Realty',
  // Materials
  LIN: 'Linde',               APD: 'Air Products',        ECL: 'Ecolab',
  NEM: 'Newmont',             FCX: 'Freeport-McMoRan',    NUE: 'Nucor',
  DOW: 'Dow',                 SHW: 'Sherwin-Williams',    ALB: 'Albemarle',
  DD: 'DuPont',               PPG: 'PPG Industries',
  // Telecom
  T: 'AT&T',                  VZ: 'Verizon',              TMUS: 'T-Mobile',
  CHTR: 'Charter Comms',      CMCSA: 'Comcast',
  // China ADRs
  BABA: 'Alibaba',            JD: 'JD.com',               PDD: 'PDD Holdings',
  BIDU: 'Baidu',              NIO: 'NIO',                  XPEV: 'XPeng',
  LI: 'Li Auto',              NTES: 'NetEase',             TME: 'Tencent Music',
  BILI: 'Bilibili',           IQ: 'iQIYI',                VIPS: 'Vipshop',
  TAL: 'TAL Education',       EDU: 'New Oriental',        FUTU: 'Futu Holdings',
  MNSO: 'MINISO',             YMM: 'Full Truck Alliance',  BZ: 'BOSS Zhipin',
  QFIN: '360 DigiTech',       MOMO: 'Hello Group',
  // International ADRs
  TSM: 'TSMC',                NVO: 'Novo Nordisk',        ASML: 'ASML',
  SHOP: 'Shopify',            MELI: 'MercadoLibre',
  // ETFs
  SPY: 'S&P 500',             QQQ: 'Nasdaq 100',          IWM: 'Russell 2000',
  DIA: 'Dow Jones',           VTI: 'Total Market',        SCHD: 'Dividend ETF',
  XLF: 'Financials',          XLK: 'Technology',          XLE: 'Energy',
  XLV: 'Healthcare',          XLI: 'Industrials',         ARKK: 'ARK Innovation',
  GLD: 'Gold',                TLT: '20Y Treasury',        HYG: 'High Yield Bonds',
  SOXX: 'Semiconductors',
}

export const SECTOR_MAP: Record<string, string> = {
  // Tech
  AAPL: 'Tech',    MSFT: 'Tech',    GOOGL: 'Tech',   AMZN: 'Tech',
  NVDA: 'Tech',    META: 'Tech',    TSLA: 'Tech',    AVGO: 'Tech',
  AMD: 'Tech',     INTC: 'Tech',    QCOM: 'Tech',    MU: 'Tech',
  AMAT: 'Tech',    LRCX: 'Tech',    KLAC: 'Tech',    MRVL: 'Tech',
  TXN: 'Tech',     ARM: 'Tech',     SMCI: 'Tech',    SWKS: 'Tech',
  MCHP: 'Tech',    MPWR: 'Tech',    ON: 'Tech',      STX: 'Tech',
  WDC: 'Tech',     ORCL: 'Tech',    ADBE: 'Tech',    CRM: 'Tech',
  NFLX: 'Tech',    NOW: 'Tech',     WDAY: 'Tech',    SNOW: 'Tech',
  DDOG: 'Tech',    NET: 'Tech',     PANW: 'Tech',    CRWD: 'Tech',
  PLTR: 'Tech',    INTU: 'Tech',    ADSK: 'Tech',    CDNS: 'Tech',
  SNPS: 'Tech',    HUBS: 'Tech',    MDB: 'Tech',     TWLO: 'Tech',
  ZM: 'Tech',      DOCU: 'Tech',    TEAM: 'Tech',    PAYC: 'Tech',
  ZI: 'Tech',      BILL: 'Tech',    CSCO: 'Tech',    IBM: 'Tech',
  UBER: 'Tech',    COIN: 'Tech',    DELL: 'Tech',    HPQ: 'Tech',
  SPOT: 'Tech',    TTD: 'Tech',     APP: 'Tech',     HPE: 'Tech',
  ANET: 'Tech',    RBLX: 'Tech',    MSTR: 'Tech',    ZS: 'Tech',
  OKTA: 'Tech',    FTNT: 'Tech',    SNAP: 'Tech',    PINS: 'Tech',
  MTCH: 'Tech',    DKNG: 'Tech',
  // Finance
  JPM: 'Finance',  BAC: 'Finance',  WFC: 'Finance',  C: 'Finance',
  MS: 'Finance',   GS: 'Finance',   SCHW: 'Finance', USB: 'Finance',
  PNC: 'Finance',  TFC: 'Finance',  COF: 'Finance',  RF: 'Finance',
  HBAN: 'Finance', KEY: 'Finance',  FITB: 'Finance', V: 'Finance',
  MA: 'Finance',   PYPL: 'Finance', AXP: 'Finance',  SQ: 'Finance',
  AFRM: 'Finance', FISV: 'Finance', FIS: 'Finance',  HOOD: 'Finance',
  BLK: 'Finance',  BX: 'Finance',   'BRK-B': 'Finance', KKR: 'Finance',
  APO: 'Finance',  ARES: 'Finance', TROW: 'Finance', SPGI: 'Finance',
  MCO: 'Finance',  CME: 'Finance',  ICE: 'Finance',  NDAQ: 'Finance',
  CBOE: 'Finance', MET: 'Finance',  PRU: 'Finance',  AFL: 'Finance',
  CB: 'Finance',   PGR: 'Finance',  ALL: 'Finance',
  // Health
  JNJ: 'Health',   PFE: 'Health',   ABBV: 'Health',  LLY: 'Health',
  MRK: 'Health',   ABT: 'Health',   TMO: 'Health',   AMGN: 'Health',
  BMY: 'Health',   GILD: 'Health',  VRTX: 'Health',  REGN: 'Health',
  MRNA: 'Health',  BIIB: 'Health',  ILMN: 'Health',  RPRX: 'Health',
  ISRG: 'Health',  MDT: 'Health',   BSX: 'Health',   SYK: 'Health',
  EW: 'Health',    BDX: 'Health',   BAX: 'Health',   DXCM: 'Health',
  DHR: 'Health',   A: 'Health',     IQV: 'Health',   RMD: 'Health',
  HOLX: 'Health',  PODD: 'Health',  ALGN: 'Health',  GEHC: 'Health',
  ZBH: 'Health',   IDXX: 'Health',  STE: 'Health',   UNH: 'Health',
  CVS: 'Health',   CI: 'Health',    HUM: 'Health',   MOH: 'Health',
  CNC: 'Health',   MCK: 'Health',   CAH: 'Health',
  // Consumer
  WMT: 'Consumer', COST: 'Consumer', KO: 'Consumer', PEP: 'Consumer',
  PG: 'Consumer',  MO: 'Consumer',  PM: 'Consumer',  CL: 'Consumer',
  KR: 'Consumer',  CLX: 'Consumer', MCD: 'Consumer', SBUX: 'Consumer',
  YUM: 'Consumer', CMG: 'Consumer', DPZ: 'Consumer', HD: 'Consumer',
  NKE: 'Consumer', DIS: 'Consumer', TGT: 'Consumer', LOW: 'Consumer',
  TJX: 'Consumer', LULU: 'Consumer', ABNB: 'Consumer', BKNG: 'Consumer',
  GM: 'Consumer',  F: 'Consumer',   EBAY: 'Consumer', ETSY: 'Consumer',
  BBY: 'Consumer', DLTR: 'Consumer', DG: 'Consumer', TSCO: 'Consumer',
  WSM: 'Consumer', RH: 'Consumer',  ULTA: 'Consumer', MAR: 'Consumer',
  HLT: 'Consumer', RCL: 'Consumer', CCL: 'Consumer', EXPE: 'Consumer',
  MGM: 'Consumer', LVS: 'Consumer', CZR: 'Consumer',
  // Industrial
  LMT: 'Industrial', RTX: 'Industrial', GD: 'Industrial', NOC: 'Industrial',
  LHX: 'Industrial', HII: 'Industrial', BA: 'Industrial', GE: 'Industrial',
  HON: 'Industrial', CAT: 'Industrial', DE: 'Industrial', EMR: 'Industrial',
  ETN: 'Industrial', ROK: 'Industrial', AME: 'Industrial', IR: 'Industrial',
  PH: 'Industrial',  ITW: 'Industrial', CARR: 'Industrial', OTIS: 'Industrial',
  UPS: 'Industrial', FDX: 'Industrial', WM: 'Industrial', RSG: 'Industrial',
  CTAS: 'Industrial', FAST: 'Industrial', GWW: 'Industrial', PWR: 'Industrial',
  AXON: 'Industrial', VRSK: 'Industrial', EFX: 'Industrial', CPRT: 'Industrial',
  BAH: 'Industrial', LDOS: 'Industrial', MMM: 'Industrial',
  // Transport
  CSX: 'Transport',  UNP: 'Transport', NSC: 'Transport', DAL: 'Transport',
  UAL: 'Transport',  LUV: 'Transport', AAL: 'Transport', JBHT: 'Transport',
  CHRW: 'Transport', EXPD: 'Transport', SAIA: 'Transport',
  // Energy
  XOM: 'Energy',   CVX: 'Energy',   COP: 'Energy',   OXY: 'Energy',
  EOG: 'Energy',   DVN: 'Energy',   FANG: 'Energy',  HES: 'Energy',
  APA: 'Energy',   SLB: 'Energy',   HAL: 'Energy',   BKR: 'Energy',
  MPC: 'Energy',   VLO: 'Energy',   PSX: 'Energy',   WMB: 'Energy',
  KMI: 'Energy',   OKE: 'Energy',   LNG: 'Energy',
  // Utilities
  NEE: 'Utilities', DUK: 'Utilities', SO: 'Utilities',  CEG: 'Utilities',
  SRE: 'Utilities', D: 'Utilities',   EXC: 'Utilities', AES: 'Utilities',
  // Real Estate
  PLD: 'Real Estate', AMT: 'Real Estate', CCI: 'Real Estate', EQIX: 'Real Estate',
  SPG: 'Real Estate', O: 'Real Estate',   PSA: 'Real Estate', EXR: 'Real Estate',
  VICI: 'Real Estate', WELL: 'Real Estate', AVB: 'Real Estate', DLR: 'Real Estate',
  // Materials
  LIN: 'Materials', APD: 'Materials', ECL: 'Materials', NEM: 'Materials',
  FCX: 'Materials', NUE: 'Materials', DOW: 'Materials', SHW: 'Materials',
  ALB: 'Materials', DD: 'Materials',  PPG: 'Materials',
  // Telecom
  T: 'Telecom',    VZ: 'Telecom',    TMUS: 'Telecom', CHTR: 'Telecom',
  CMCSA: 'Telecom',
  // China ADRs
  BABA: 'China',   JD: 'China',     PDD: 'China',    BIDU: 'China',
  NIO: 'China',    XPEV: 'China',   LI: 'China',     NTES: 'China',
  TME: 'China',    BILI: 'China',   IQ: 'China',     VIPS: 'China',
  TAL: 'China',    EDU: 'China',    FUTU: 'China',   MNSO: 'China',
  YMM: 'China',    BZ: 'China',     QFIN: 'China',   MOMO: 'China',
  // International ADRs
  TSM: 'Intl',     NVO: 'Intl',     ASML: 'Intl',    SHOP: 'Intl',
  MELI: 'Intl',
  // ETFs
  SPY: 'ETF',      QQQ: 'ETF',      IWM: 'ETF',      DIA: 'ETF',
  VTI: 'ETF',      SCHD: 'ETF',     XLF: 'ETF',      XLK: 'ETF',
  XLE: 'ETF',      XLV: 'ETF',      XLI: 'ETF',      ARKK: 'ETF',
  GLD: 'ETF',      TLT: 'ETF',      HYG: 'ETF',      SOXX: 'ETF',
}
