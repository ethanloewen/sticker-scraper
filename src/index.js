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
    'navi 2020': 'https://steamcdn-a.akamaihd.net/apps/730/icons/econ/stickers/rmr2020/navi.afde6ff3f9bb974066e6791013b44babab5b5f27.png',
    's1mple (gold) 2021': 'https://steamcdn-a.akamaihd.net/apps/730/icons/econ/stickers/stockh2021/sig_s1mple_gold.18cad5a3b425cc3db4c5a4e3571b5fbc9f2780f0.png',
    'cloud9 (holo) MLG columbus 2016': 'https://steamcdn-a.akamaihd.net/apps/730/icons/econ/stickers/columbus2016/c9_holo.9c06edd65419a876e9d93600e49d5bed03aac049.png',
    'assasin (holo)': 'https://steamcdn-a.akamaihd.net/apps/730/icons/econ/stickers/halo/assassin_holo.7bbe8c0f31d77b5e637e4674ce103a7dc21daae4.png',
    'infinite diamond (holo)': 'https://steamcdn-a.akamaihd.net/apps/730/icons/econ/stickers/spring2022/infinite_diamond_holo.c00f9decab265d48ec94b4ca9dbb4528cbf768e5.png',
    'luminosity gaming (holo) MLG columbus 2016': 'https://steamcdn-a.akamaihd.net/apps/730/icons/econ/stickers/columbus2016/lumi_holo.439d12318fcf27986e8680abcab10834c1f03c25.png',
    'luminosity gaming MLG columbus 2016': 'https://steamcdn-a.akamaihd.net/apps/730/icons/econ/stickers/columbus2016/lumi.2b4b6363528203dfb075646915fee89507baad8e.png',
};

// stickers for the program to check for
const searchForStickers = [
    stickerDB['battle scarred (holo)'],
    stickerDB['battle scarred'],
    stickerDB['s1mple (gold) 2021'],
    stickerDB['cloud9 (holo) MLG columbus 2016'],
    stickerDB['infinite diamond (holo)'],
    stickerDB['luminosity gaming (holo) MLG columbus 2016'],
    stickerDB['luminosity gaming MLG columbus 2016'],
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

    // // set min price
    // await setMinPrice(page, minPrice);

    // set max price
    await setMaxPrice(page, maxPrice);

    // close popup
    await page.waitForTimeout(2000);
    await page.click('#app > div.v-application--wrap > main > div > div > div > div.player-wrapper.shown > button');

    await page.click('#app > div.v-application--wrap > main > div > div > div > div.site-inventory.col-md-6.col-12 > div > div.inventory-card.v-card.v-sheet.v-sheet--outlined.theme--dark.pb-2.mb-6.light-bg > div.row.pb-2.mb-3.mt-2 > div > div > div > div > div.rounded-0.pt-0.no-box-shadow.v-card.v-sheet.theme--dark.filters-wrapper.light-bg > div > div.d-flex.pa-0.pl-3.filters-container.filters.game-container.flex-shrink-1.col-auto.col > div > div > div > div');
    await page.waitForTimeout(1000);
    await page.click('#list-95 > div:nth-child(4)');

    // search for item
    await searchItem(page, query);

    // handle loading/unloading sections of items to avoid page lag/crashes
    await actionCycle(page, loadMax, minPrice);

    // console.log('done program cycle : items searched -', itemsSearched);
};

async function actionCycle(page, loadMax, minPrice) {
    let continueCycle = true;
    let newMinPrice = minPrice;

    while (continueCycle) {
        // unstack item containers
        let unstackResult = await unstackItems(page, loadMax, newMinPrice);
                
        // find the items that contain target stickers
        await findStickers(page);

        // break loop or set new minimum price for the next unstackItems cycle
        if (unstackResult == false) {
            continueCycle = false;
        } else {
            newMinPrice = unstackResult;
        }
    }
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
async function unstackItems(page, loadMax, minPrice) {
    let count = 0;
    let doneLoading = false;
    let returnStr = '';
    let stackPrice = '';

    setMinPrice(page, minPrice);
    await page.waitForTimeout(1500);

    // Loop will terminate when count > loadMax
    while (true) {
        await page.waitForTimeout(1500);

        if (await page.$('#siteInventoryContainer .count')) {
            const unstackContainer = await page.$('#siteInventoryContainer .count');
            const unstackParent = (await unstackContainer.$x('../..'))[0];
            stackPrice = (await unstackParent.$eval('.price', el => el.innerHTML)).trim();
            console.log('stacked item price', stackPrice);

            await page.click('#siteInventoryContainer .count');
            count++;
        } else {
            // no more cycles as all containers have been expanded
            console.log('hit before break');
            break;
        }

        // continue to next cycle
        if (count >= loadMax) {
            console.log('count exceeds loadMax');
            returnStr = stackPrice.slice(1);
            // console.log('return string -> ', returnStr);
            break;
        }
    }

    console.log('items unstacked -', count);
    return (returnStr === '') ? false : returnStr;
};

// find the items that contain target stickers & return the number of items that were looked at
async function findStickers(page) {
    const stickerElements = await page.$$('#siteInventoryContainer > div > div > div > div > div > div > div.item-details.md.pa-2 > div.flex.emojis.d-flex.flex-column');

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
            const itemName = (await itemParent.$eval('.hover-info .item-hover-name', el => el.innerHTML)).trim();
            const itemPrice = (await itemParent.$eval('.price', el => el.innerHTML)).trim();
            const itemWear = (await itemParent.$eval('.w-100:nth-of-type(2) > span:nth-last-child(2)', el => el.innerHTML)).trim();
            const itemFloat = (await itemParent.$eval('.w-100:nth-of-type(2) > span:nth-last-child(1)', el => el.innerHTML)).trim();
            // const itemIsST = await itemParent.$eval('.w-100:nth-of-type(2) span:nth-of-type(1)', el => el.innerHTML);
            console.log(itemName, '-', itemPrice, '-', itemWear, '-', itemFloat);
            await item.click();

            console.log('Found:', latestStickerMatch);
            // popupClose = false;
        }
    
        // reset stickerFound var
        stickerFound = false;
    }

    // return itemsSearched;
}

async function setMinPrice(page, minPrice) {
    const minInput = await page.$('#advanced-filter .price-inputs > div:nth-child(1) input');
    await minInput.click({clickCount: 3});
    await minInput.press('Backspace');
    await page.keyboard.type(minPrice, {
        delay: 50,
    });
}

async function setMaxPrice(page, maxPrice) {
    const maxInput = await page.$('#advanced-filter .price-inputs > div:nth-child(2) input');
    await maxInput.click({clickCount: 3});
    await maxInput.press('Backspace');
    await page.keyboard.type(maxPrice, {
        delay: 50,
    });
}



// getStickers function params:
//  (String: item name), (Number: load limit per page [defaults=100]), (String: min price [default=0]), (String: max price [default=0])
getStickers('ak-47', 50, '0', '20');