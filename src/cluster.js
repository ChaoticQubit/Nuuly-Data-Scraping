const { Cluster } = require('puppeteer-cluster');
const puppeteer = require('puppeteer');
var fs = require('fs');

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
        console.log(url);
        try{
            await page.goto(url, {waitUntil: "load"});
            await page.click("button.c-product-reviews-summary__button")
            await page.waitForSelector("div.c-product-reviews-drawer__container");
            
            let buttonPresent = false;
            while (!buttonPresent) {
                const button = await page.$("button.c-button--loading-button");
                buttonPresent = button !== null;
        
                if (buttonPresent) {
                    await button.click();
                } else {
                    await page.waitFor(1000);
                }
            }
            const reviews = await page.$$('div.c-product-reviews-drawer__container');
            console.log(reviews);
        }catch (error) {
            console.error('Error:', error);
        }finally{
            
            // for(const review of reviews) {
            //     try {
            //         const reviewText = await page.evaluate(el => el.querySelector('div > h1').textContent, review);
            //         fs.appendFile('reviews.txt', `${reviewText}\n`, function (err) {
            //             if (err) throw err;
            //         });
            //     } catch (error) {
            //         console.log(error);
            //     }
            // }
        }
    });

    for(const link of productLinks.splice(0, 1)){
        await cluster.queue(link);
    }

    await cluster.idle();
    await cluster.close();
})();