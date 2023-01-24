const puppeteer = require('puppeteer-extra');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const categoryId = {
    heavy: 1,
    pistol: 3,
    rifle: 4,
    smg: 5,
};

async function getStickers(query) {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/opt/homebrew/bin/chromium',
        args: ['--start-maximized']
    });

    const page = await browser.newPage();
    await page.goto('https://tradeit.gg/csgo/trade');
    await page.waitForTimeout(5000);

    // select 'has stickers' category
    await page.evaluate(() => {
        document.querySelectorAll('.v-input--selection-controls__ripple')[9].click();
    });

    // select search bar and input query
    await page.click('#input-92');
    await page.keyboard.type('desert eagle', {
        delay: 50,
    });

    // page.waitForSelector('.item-container').then(() => {
    //     page.click('.item-container');
    //     // console.log('now');
    // });

    await page.waitForTimeout(2000);
    // await page.click('#siteInventoryContainer .unstackContainer');

    const elementsToExpand = await page.$$('#siteInventoryContainer .count');

    for (let i = 0; i < 10; i++) {
        await page.click('#siteInventoryContainer .count');
        await page.waitForTimeout(1500);
    }
};

getStickers();