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

    await page.waitForTimeout(3000);
    // await page.click('#siteInventoryContainer .unstackContainer');

    // const elementsToExpand = await page.$$('#siteInventoryContainer .count');

    for (let i = 0; i < 5; i++) {
        await page.click('#siteInventoryContainer .count');
        await page.waitForTimeout(1500);
    }

    // const foundStickers = [];
    // // for (let i = 0; i < 10; i++) {
    // foundStickers.push(await page.$eval('#siteInventoryContainer .emojis img', element=> element.getAttribute('src')));
    // // }
    // console.log(foundStickers);

    // const stickerElements = await page.$$('#siteInventoryContainer .emojis img');
    const stickerElements = await page.$$('#siteInventoryContainer > div > div > div > div > div > div > div.item-details.md.pa-2 > div.flex.emojis.d-flex.flex-column');

    for (let i = 0; i < stickerElements.length; i++) {
        const item = stickerElements[i];
        const stickersArr = await item.$$('img');
        const targetSticker = stickerDB['battle scarred'];
        let stickerFound = false;

        // console.log('length', Object.keys(item).length);
        // console.log(stickersArr);
        // console.log(stickersArr.length)

        for (let sticker of stickersArr) {
            const stickerUrl = await page.evaluate(el => el.getAttribute('src'), sticker);
            // console.log(stickerUrl);

            if (stickerUrl == targetSticker) {
                stickerFound = true;
            }
        }

        if (stickerFound) {
            //click on item with sticker
            console.log('sticker found');
        }
    
        // reset stickerFound var
        stickerFound = false;

        // const childrenArr = await page.evaluate(item => item.children, item);
        // for (let j = 0; j < stickersArr.length; j++) {
        //     sticker = stickersArr[j];
        //     const stickerSrc = await sticker.$eval(elm => elm.getAttribute('src'));
        //     // console.log('src', stickerSrc);
        //     if (stickerSrc == targetSticker) {
        //         console.log('hit here');
        //         stickerFound = true;
        //     }
        // }
    }

    

    // #siteInventoryContainer > div > div > div > div > div > div > div.item-details.md.pa-2 > div.flex.emojis.d-flex.flex-column > img

    // console.log('stickers on page', stickerElements);
};

getStickers('desert eagle print');