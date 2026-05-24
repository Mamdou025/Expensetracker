// Curated list of major Canadian financial institutions and credit card
// issuers. `domain` is used to fetch a logo via the Google favicon service.
// `products` lists the account types the institution typically offers.

export const PRODUCT_LABELS = {
  chequing: 'Chequing',
  savings: 'Savings',
  credit_card: 'Credit card',
  line_of_credit: 'Line of credit',
  mortgage: 'Mortgage',
  investment: 'Investment',
};

export const CANADIAN_BANKS = [
  { id: 'rbc', name: 'RBC Royal Bank', domain: 'rbcroyalbank.com',
    products: ['chequing', 'savings', 'credit_card', 'line_of_credit', 'mortgage', 'investment'] },
  { id: 'td', name: 'TD Canada Trust', domain: 'td.com',
    products: ['chequing', 'savings', 'credit_card', 'line_of_credit', 'mortgage', 'investment'] },
  { id: 'scotiabank', name: 'Scotiabank', domain: 'scotiabank.com',
    products: ['chequing', 'savings', 'credit_card', 'line_of_credit', 'mortgage', 'investment'] },
  { id: 'bmo', name: 'BMO Bank of Montreal', domain: 'bmo.com',
    products: ['chequing', 'savings', 'credit_card', 'line_of_credit', 'mortgage', 'investment'] },
  { id: 'cibc', name: 'CIBC', domain: 'cibc.com',
    products: ['chequing', 'savings', 'credit_card', 'line_of_credit', 'mortgage', 'investment'] },
  { id: 'nbc', name: 'Banque Nationale du Canada', domain: 'bnc.ca',
    products: ['chequing', 'savings', 'credit_card', 'line_of_credit', 'mortgage', 'investment'] },
  { id: 'desjardins', name: 'Desjardins', domain: 'desjardins.com',
    products: ['chequing', 'savings', 'credit_card', 'line_of_credit', 'mortgage', 'investment'] },
  { id: 'tangerine', name: 'Tangerine', domain: 'tangerine.ca',
    products: ['chequing', 'savings', 'credit_card', 'line_of_credit', 'investment'] },
  { id: 'simplii', name: 'Simplii Financial', domain: 'simplii.com',
    products: ['chequing', 'savings', 'credit_card', 'line_of_credit', 'mortgage'] },
  { id: 'eq', name: 'EQ Bank', domain: 'eqbank.ca',
    products: ['savings', 'chequing', 'investment'] },
  { id: 'laurentian', name: 'Laurentian Bank', domain: 'laurentianbank.ca',
    products: ['chequing', 'savings', 'credit_card', 'mortgage', 'investment'] },
  { id: 'hsbc', name: 'HSBC Canada', domain: 'hsbc.ca',
    products: ['chequing', 'savings', 'credit_card', 'mortgage', 'investment'] },
  { id: 'meridian', name: 'Meridian Credit Union', domain: 'meridiancu.ca',
    products: ['chequing', 'savings', 'credit_card', 'mortgage', 'investment'] },
  { id: 'vancity', name: 'Vancity', domain: 'vancity.com',
    products: ['chequing', 'savings', 'credit_card', 'mortgage', 'investment'] },
  { id: 'pc_financial', name: 'PC Financial', domain: 'pcfinancial.ca',
    products: ['chequing', 'savings', 'credit_card'] },
  { id: 'koho', name: 'KOHO', domain: 'koho.ca',
    products: ['chequing', 'savings', 'credit_card'] },
  { id: 'neo', name: 'Neo Financial', domain: 'neofinancial.com',
    products: ['credit_card', 'chequing', 'savings'] },
  { id: 'wealthsimple', name: 'Wealthsimple', domain: 'wealthsimple.com',
    products: ['chequing', 'investment', 'credit_card'] },
  { id: 'mbna', name: 'MBNA', domain: 'mbna.ca',
    products: ['credit_card'] },
  { id: 'capital_one', name: 'Capital One Canada', domain: 'capitalone.ca',
    products: ['credit_card'] },
  { id: 'amex', name: 'American Express Canada', domain: 'americanexpress.com',
    products: ['credit_card'] },
  { id: 'triangle', name: 'Triangle (Canadian Tire)', domain: 'canadiantire.ca',
    products: ['credit_card'] },
  { id: 'rogers_bank', name: 'Rogers Bank', domain: 'rogersbank.com',
    products: ['credit_card'] },
  { id: 'brim', name: 'Brim Financial', domain: 'brimfinancial.com',
    products: ['credit_card'] },
];

export const findBank = (id) => CANADIAN_BANKS.find(b => b.id === id);

export const logoUrl = (domain) =>
  domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;
