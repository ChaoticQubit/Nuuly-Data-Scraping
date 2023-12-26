const { Cluster } = require('puppeteer-cluster');
var fs = require('fs');
const { cssSelectors } = require('./data/css_selectors');

(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 1,
        monitor: true,
        puppeteerOptions: {
            headless: false,
            defaultViewport: false,
            userDataDir: './user_data',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
        },
    });

    let productLinks = fs.readFileSync('links.txt', 'utf8').split('\n').slice(1);

    cluster.on('taskerror', (err, data) => {
        console.log(`Error crawling ${data}: ${err.message}`);
    });

    await cluster.task(async ({ page, data: url }) => {
        try{
            await page.goto(url, {waitUntil: "load"});
            await page.click(cssSelectors.VIEW_ALL_REVIEWS_BTN);
            await page.waitForSelector(cssSelectors.REVIEWS_CONTAINER);

            const isElementVisible = async (page, cssSelector) => {
                let visible = true;
                await page
                    .waitForSelector(cssSelector, { visible: true, timeout: 100 })
                    .catch(() => {
                        visible = false;
                    });
                return visible;
            };

            let loadMoreVisible = await isElementVisible(page, cssSelectors.GET_MORE_REVIEWS_BTN);
            while (loadMoreVisible) {
            await page
                .click(cssSelectors.GET_MORE_REVIEWS_BTN)
                .catch(() => {});
                loadMoreVisible = await isElementVisible(page, cssSelectors.GET_MORE_REVIEWS_BTN);
            }
        }catch (error) {
            console.error('Error:', error);
        }finally{
            const reviews = await page.$$('div.c-product-review-card');
            console.log(reviews.length);
        }
    });

    // for(const link of productLinks.splice(0, 1)){
    //     await cluster.queue(link);
    // }

    await cluster.queue('https://www.nuuly.com/rent/products/retro-floral-tiered-duster?color=001');

    await cluster.idle();
    await cluster.close();
})();