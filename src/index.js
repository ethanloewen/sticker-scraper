const puppeteer = require('puppeteer-extra');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const categoryId = {
    heavy: 1,
    pistol: 3,
    rifle: 4,
    smg: 5,
};

puppeteer.launch({
    headless: false,
    executablePath: '/opt/homebrew/bin/chromium',
    args: ['--start-maximized']
})
.then(async browser => {
    const page = await browser.newPage();
    await page.goto('https://tradeit.gg/csgo/trade');
    await page.waitForTimeout(2000);

    // select 'has stickers' category
    await page.evaluate(() => {
        document.querySelectorAll('.v-input--selection-controls__ripple')[9].click();
    });

    // select search bar and input query
    await page.click('#input-92');
    await page.keyboard.type('m4a4', {
        delay: 50,
    });

    // page.waitForSelector('.item-container').then(() => {
    //     page.click('.item-container');
    //     // console.log('now');
    // });

    setTimeout(() => {
        page.hover('.item-container');
    }, 3000);

    
    // await page.screenshot({path: 'screenshot.jpg'});
    // await browser.close();
});