const { type } = require('os');
const puppeteer = require('puppeteer-extra');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const categoryId = {
    heavy: 1,
    pistol: 3,
    rifle: 4,
    smg: 5,
};

const stickerDB = {
    'battle scarred': 'https://steamcdn-a.akamaihd.net/apps/730/icons/econ/stickers/broken_fang/battle_scarred.8f95410ed52cdf856221264b667960419e6bbde0.png',
    'battle scarred (holo)': 'https://steamcdn-a.akamaihd.net/apps/730/icons/econ/stickers/broken_fang/battle_scarred_holo.655bc441df4fffe528bc8d47b397b581d4499606.png'
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
    await page.keyboard.type(query, {
        delay: 50,
    });

    // close popup
    await page.click('#app > div.v-application--wrap > main > div > div > div > div.player-wrapper.shown > button');

    await page.waitForTimeout(5000);

    for (let i = 0; i < 15; i++) {
        await page.click('#siteInventoryContainer .count');
        await page.waitForTimeout(1500);
    }

    // const stickerElements = await page.$$('#siteInventoryContainer .emojis img');
    const stickerElements = await page.$$('#siteInventoryContainer > div > div > div > div > div > div > div.item-details.md.pa-2 > div.flex.emojis.d-flex.flex-column');
    // let popupClose = true;

    for (let i = 0; i < stickerElements.length; i++) {
        // close popup if it exists
        if (await page.$('#app > div.v-dialog__content.v-dialog__content--active .buttons-container > button')) {
            await page.click('#app > div.v-dialog__content.v-dialog__content--active .buttons-container > button');
        }

        const item = stickerElements[i];
        const stickersArr = await item.$$('img');
        const targetSticker = stickerDB['battle scarred (holo)'];
        let stickerFound = false;

        for (let sticker of stickersArr) {
            const stickerUrl = await page.evaluate(el => el.getAttribute('src'), sticker);

            if (stickerUrl == targetSticker) {
                stickerFound = true;
            }
        }

        if (stickerFound) {
            // click on item with sticker
            await item.click();

            console.log('sticker found');
            // popupClose = false;
        }
    
        // reset stickerFound var
        stickerFound = false;
    }
};

getStickers('ak-47');