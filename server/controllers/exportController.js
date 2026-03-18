const pool = require('../db/db');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer'); // <-- ADD THIS

// Ensure exports directory exists
const exportsDir = path.join(__dirname, '../exports');
if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir);
}

// ... Keep your existing saveExport function exactly as is ...
exports.saveExport = async (req, res) => { /* ... */ };

// ... Keep your existing getExportById function exactly as is ...
exports.generatePDF = async (req, res) => {
    // 1. Grab the new storage variables from req.body
    const { targetUrl, theme, layout, userData, pinnedCharts, pinKey } = req.body; 

    if (!targetUrl) {
        return res.status(400).json({ error: "Missing targetUrl" });
    }

    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });

        await page.emulateMediaFeatures([
            { name: 'prefers-color-scheme', value: theme || 'light' }
        ]);

        const token = req.headers.authorization?.split(' ')[1];
        
        // 2. INJECT THE PINNED CHARTS INTO PUPPETEER'S MEMORY
        await page.evaluateOnNewDocument((token, theme, layout, userData, pinnedCharts, pinKey) => {
            if (token) localStorage.setItem('token', token);
            localStorage.setItem('theme', theme);
            if (layout) localStorage.setItem('lumina_layout', layout);
            
            // This is the magic fix that makes sure Puppeteer sees the exact charts you do!
            if (userData) localStorage.setItem('user', userData);
            if (pinKey && pinnedCharts) localStorage.setItem(pinKey, pinnedCharts);
            
        }, token, theme, layout, userData, pinnedCharts, pinKey);

        await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 });

        // Force theme classes
        if (theme === 'dark') {
            await page.evaluate(() => {
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark');
            });
        }

        await page.evaluate(() => {
            const sidebar = document.querySelector('.assistant-sidebar');
            const nav = document.querySelector('.topbar-shell'); 
            const exportModal = document.querySelector('[style*="z-index: 3000"]'); 
            
            if (sidebar) sidebar.style.display = 'none';
            if (nav) nav.style.display = 'none';
            if (exportModal) exportModal.style.display = 'none';

            // Ensure grid container stretches fully
            const style = document.createElement('style');
            style.innerHTML = `
                html, body, #root, .dd-root, .dd-body, .dd-canvas-area, .dashboard-wrapper, .dashboard-main {
                    height: auto !important;
                    min-height: auto !important;
                    max-height: none !important;
                    overflow: visible !important;
                    position: static !important;
                }
                .react-grid-layout {
                    height: auto !important;
                    overflow: visible !important;
                }
                .dd-panel {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }
            `;
            document.head.appendChild(style);
        });

        await new Promise(resolve => setTimeout(resolve, 1500)); // Let the grid layout settle

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true, 
            printBackground: true, 
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="Lumina_Dashboard.pdf"',
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);

    } catch (err) {
        console.error("Puppeteer Error:", err);
        res.status(500).json({ error: "Failed to generate PDF" });
    } finally {
        if (browser) await browser.close();
    }
};