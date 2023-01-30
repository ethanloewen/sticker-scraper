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

// collection of stickers
const stickerDB = {
    'battle scarred': 'https://steamcdn-a.akamaihd.net/apps/730/icons/econ/stickers/broken_fang/battle_scarred.8f95410ed52cdf856221264b667960419e6bbde0.png',
    'battle scarred (holo)': 'https://steamcdn-a.akamaihd.net/apps/730/icons/econ/stickers/broken_fang/battle_scarred_holo.655bc441df4fffe528bc8d47b397b581d4499606.png',
    'navi 2020': 'https://steamcdn-a.akamaihd.net/apps/730/icons/econ/stickers/rmr2020/navi.afde6ff3f9bb974066e6791013b44babab5b5f27.png'
};

// stickers for the program to check for
const searchForStickers = [
    stickerDB['battle scarred (holo)'],
    stickerDB['battle scarred'],
    stickerDB['navi 2020']
];

async function getStickers(query, loadMax = 100, minPrice = '0', maxPrice = '100000') {
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

    // set min price
    await setMinPrice(minPrice);

    // set max price
    await setMaxPrice(maxPrice);

    // close popup
    await page.waitForTimeout(2000);
    await page.click('#app > div.v-application--wrap > main > div > div > div > div.player-wrapper.shown > button');

    await page.click('#app > div.v-application--wrap > main > div > div > div > div.site-inventory.col-md-6.col-12 > div > div.inventory-card.v-card.v-sheet.v-sheet--outlined.theme--dark.pb-2.mb-6.light-bg > div.row.pb-2.mb-3.mt-2 > div > div > div > div > div.rounded-0.pt-0.no-box-shadow.v-card.v-sheet.theme--dark.filters-wrapper.light-bg > div > div.d-flex.pa-0.pl-3.filters-container.filters.game-container.flex-shrink-1.col-auto.col > div > div > div > div');
    await page.waitForTimeout(1000);
    await page.click('#list-95 > div:nth-child(4)');

    // search for item
    await searchItem(page, query);

    // unstack item containers
    await unstackItems(page, loadMax);
    

    // const stickerElements = await page.$$('#siteInventoryContainer .emojis img');
    const stickerElements = await page.$$('#siteInventoryContainer > div > div > div > div > div > div > div.item-details.md.pa-2 > div.flex.emojis.d-flex.flex-column');
    // let popupClose = true;

    let itemsSearched = 0;

    for (let i = 0; i < stickerElements.length; i++) {
        // close popup if it exists
        if (await page.$('#app > div.v-dialog__content.v-dialog__content--active .buttons-container > button')) {
            await page.click('#app > div.v-dialog__content.v-dialog__content--active .buttons-container > button');
        }

        const item = stickerElements[i];
        // find the parent node 2 levels up with xPath
        const itemParent = (await item.$x('../..'))[0];
        // console.log('item parent', itemParent);

        const stickersArr = await item.$$('img');
        // const targetSticker = stickerDB['navi 2020'];
        let stickerFound = false;
        let latestStickerMatch = '';

        for (let sticker of stickersArr) {
            const stickerUrl = await page.evaluate(el => el.getAttribute('src'), sticker);

            for (const targetSticker of searchForStickers) {
                if (stickerUrl == targetSticker) {
                    stickerFound = true;
                    latestStickerMatch = Object.keys(stickerDB).find(key => stickerDB[key] === targetSticker);
                }
            }

            itemsSearched++;
        }

        if (stickerFound) {
            // click on item with sticker
            const itemName = await itemParent.$eval('.hover-info .item-hover-name', el => el.innerHTML);
            const itemPrice = await itemParent.$eval('.price', el => el.innerHTML);
            const itemWear = await itemParent.$eval('.w-100:nth-of-type(2) > span:nth-last-child(2)', el => el.innerHTML);
            const itemFloat = await itemParent.$eval('.w-100:nth-of-type(2) > span:nth-last-child(1)', el => el.innerHTML);
            // const itemIsST = await itemParent.$eval('.w-100:nth-of-type(2) span:nth-of-type(1)', el => el.innerHTML);
            console.log(itemName, '-', itemPrice, '-', itemWear, '-', itemFloat);
            await item.click();

            console.log('Found:', latestStickerMatch);
            // popupClose = false;
        }
    
        // reset stickerFound var
        stickerFound = false;
    }

    console.log('done program cycle : items searched -', itemsSearched);
};

async function searchItem(page, searchTerm) {
    // select search bar and input query
    await page.click('#input-92');
    await page.keyboard.type(searchTerm, {
        delay: 50,
    });

    await page.waitForTimeout(5000);
};

// expand stacked item groups (default tradeit.gg behavior)
async function unstackItems(page, loadMax) {
    let count = 0;
    let doneLoading = false;
    let loadingLimit = loadMax;
    while (count < loadingLimit && !doneLoading) {
        await page.waitForTimeout(1500);
        if (await page.$('#siteInventoryContainer .count')) {
            await page.click('#siteInventoryContainer .count');
            count++;
        } else {
            doneLoading = true;
        }
    }

    console.log('items unstacked -', count);
};

async function setMinPrice(minPrice) {
    const minInput = await page.$('#advanced-filter .price-inputs > div:nth-child(1) input');
    await minInput.click({clickCount: 3});
    await minInput.press('Backspace');
    await page.keyboard.type(minPrice, {
        delay: 50,
    });
}

async function setMaxPrice(maxPrice) {
    const maxInput = await page.$('#advanced-filter .price-inputs > div:nth-child(2) input');
    await maxInput.click({clickCount: 3});
    await maxInput.press('Backspace');
    await page.keyboard.type(maxPrice, {
        delay: 50,
    });
}

// getStickers function params:
//  (String: item name), (Number: load limit per page [defaults=100]), (String: min price [default=0]), (String: max price [default=0])
getStickers('usp-s', 20, '10', '100');