import puppeteer from "puppeteer";

async function getStickers(query) {
    const browser = await puppeteer.launch({
        executablePath: '/opt/homebrew/bin/chromium',
        headless: false,
        args: ['--lang=en-GB'],
    });

    const page = await browser.newPage();
};

getStickers("tester");