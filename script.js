document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const stockForm = document.getElementById('stock-form');
    const resultsSection = document.getElementById('results-section');
    const resetBtn = document.getElementById('reset-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const addToPortfolioBtn = document.getElementById('add-to-portfolio-btn');
    const portfolioBody = document.getElementById('portfolio-body');
    const portfolioEmptyMsg = document.getElementById('portfolio-empty-msg');
    const downloadCsvBtn = document.getElementById('download-csv-btn');

    // --- State Management ---
    let portfolio = [];
    let currentCalculation = null;

    // --- Helper Functions ---
    const formatCurrency = (value) => `₹${value.toFixed(2)}`;
    const formatPercent = (value) => `${value.toFixed(2)}%`;

    // --- THEME TOGGLE LOGIC ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.checked = false;
        }
    };

    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // --- PORTFOLIO LOGIC ---
    const savePortfolio = () => {
        localStorage.setItem('stockPortfolio', JSON.stringify(portfolio));
    };

    const renderPortfolio = () => {
        portfolioBody.innerHTML = ''; 
        if (portfolio.length === 0) {
            portfolioEmptyMsg.classList.remove('hidden');
            downloadCsvBtn.classList.add('hidden');
        } else {
            portfolioEmptyMsg.classList.add('hidden');
            downloadCsvBtn.classList.remove('hidden');
            portfolio.forEach((stock, index) => {
                const returnClass = stock.totalReturn >= 0 ? 'positive-return' : 'negative-return';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${stock.stockName}</td>
                    <td>${formatCurrency(stock.totalCost)}</td>
                    <td>${formatCurrency(stock.totalValueToday)}</td>
                    <td class="${returnClass}">${formatCurrency(stock.totalReturn)}</td>
                    <td class="${returnClass}">${formatPercent(stock.roi)}</td>
                    <td><button class="remove-btn" data-index="${index}">Remove</button></td>
                `;
                portfolioBody.appendChild(row);
            });
        }
    };

    const loadPortfolio = () => {
        const savedPortfolio = localStorage.getItem('stockPortfolio');
        if (savedPortfolio) {
            portfolio = JSON.parse(savedPortfolio);
        }
        renderPortfolio();
    };

    portfolioBody.addEventListener('click', (e) => {
        if(e.target.classList.contains('remove-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            portfolio.splice(index, 1);
            savePortfolio();
            renderPortfolio();
        }
    });

    // --- CSV EXPORT LOGIC ---
    const exportToCsv = () => {
        const headers = [
            'Stock Name', 'Purchase Date', 'Total Shares', 'Purchase Price Per Share', 'Total Cost',
            'Current Price', 'Current Value', 'Total Return', 'ROI (%)', 'CAGR (%)',
            'EPS', 'Book Value/Share', 'Dividend/Share',
            'Total EPS', 'Total Book Value', 'Return on EPS (%)', 'Dividend Yield (%)'
        ];
        const csvRows = [headers.join(',')];
        portfolio.forEach(stock => {
            const values = [
                stock.stockName, stock.purchaseDate, stock.totalShares, stock.purchasePricePerShare,
                stock.totalCost.toFixed(2), stock.currentPrice.toFixed(2), stock.totalValueToday.toFixed(2),
                stock.totalReturn.toFixed(2), stock.roi.toFixed(2), stock.cagr.toFixed(2),
                stock.eps.toFixed(2), stock.bookValue.toFixed(2), stock.dividend.toFixed(2),
                stock.totalEPS.toFixed(2), stock.totalBookValue.toFixed(2), stock.returnOnEPS.toFixed(2),
                stock.dividendYield.toFixed(2)
            ];
            csvRows.push(values.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'stock_portfolio.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    downloadCsvBtn.addEventListener('click', exportToCsv);

    // --- FORM SUBMISSION LOGIC ---
    stockForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const purchaseDateInput = document.getElementById('purchaseDate').value;
        const stockName = document.getElementById('stockName').value;
        const totalShares = parseFloat(document.getElementById('totalShares').value);
        const purchasePricePerShare = parseFloat(document.getElementById('purchasePricePerShare').value);
        const eps = parseFloat(document.getElementById('eps').value);
        const bookValue = parseFloat(document.getElementById('bookValue').value);
        const dividend = parseFloat(document.getElementById('dividend').value);
        const currentPrice = parseFloat(document.getElementById('currentPrice').value);

        const totalCost = purchasePricePerShare * totalShares;
        const purchaseDate = new Date(purchaseDateInput);
        const today = new Date();
        const diffTime = Math.abs(today - purchaseDate);
        const years = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        const totalDividends = dividend * totalShares;
        const totalValueToday = currentPrice * totalShares;
        const totalReturn = (totalValueToday + totalDividends) - totalCost;
        const roi = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
        let cagr = 0;
        if (years > 0 && totalCost > 0) {
             const finalValue = totalValueToday + totalDividends;
             cagr = (Math.pow((finalValue / totalCost), (1 / years)) - 1) * 100;
        }
        const totalEPS = eps * totalShares;
        const totalBookValue = bookValue * totalShares;
        const returnOnEPS = totalCost > 0 ? (totalEPS / totalCost) * 100 : 0;
        const dividendYield = purchasePricePerShare > 0 ? (dividend / purchasePricePerShare) * 100 : 0;

        currentCalculation = {
            stockName, purchaseDate: purchaseDateInput, totalShares, purchasePricePerShare, totalCost,
            currentPrice, totalValueToday, totalReturn, roi, cagr,
            eps, bookValue, dividend, totalEPS, totalBookValue, returnOnEPS, dividendYield
        };

        // Display results
        document.getElementById('reportStockName').textContent = stockName;
        document.getElementById('totalReturn').textContent = formatCurrency(totalReturn);
        document.getElementById('roi').textContent = formatPercent(roi);
        document.getElementById('cagr').textContent = formatPercent(cagr);

        const returnElement = document.getElementById('totalReturn');
        returnElement.className = totalReturn >= 0 ? 'positive-return' : 'negative-return';

        document.getElementById('totalValueToday').textContent = formatCurrency(totalValueToday);
        document.getElementById('totalDividends').textContent = formatCurrency(totalDividends);
        document.getElementById('dividendYield').textContent = formatPercent(dividendYield);
        document.getElementById('returnOnEPS').textContent = formatPercent(returnOnEPS);
        document.getElementById('totalEPS').textContent = formatCurrency(totalEPS);
        document.getElementById('totalBookValue').textContent = formatCurrency(totalBookValue);

        resultsSection.classList.remove('hidden');
    });

    // --- Add to Portfolio Button ---
    addToPortfolioBtn.addEventListener('click', () => {
        if (currentCalculation) {
            portfolio.push(currentCalculation);
            savePortfolio();
            renderPortfolio();
            resultsSection.classList.add('hidden');
            stockForm.reset();
            currentCalculation = null;
        }
    });

    // --- RESET BUTTON LOGIC ---
    resetBtn.addEventListener('click', function() {
        resultsSection.classList.add('hidden');
        currentCalculation = null;
    });

    // --- INITIALIZATION ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    loadPortfolio();
});
