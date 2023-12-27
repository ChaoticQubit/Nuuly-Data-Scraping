const { Cluster } = require('puppeteer-cluster');
const puppeteer = require('puppeteer');
var fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: false,
        userDataDir: './user_data',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
    });
    const page = await browser.newPage();

    await page.goto('https://www.nuuly.com/rent/browse/all?pageNumber=1', {waitUntil: "load"});
    const pages = await page.$('div.c-catalog-page__pagination > span');
    const totalPages = parseInt((await (await pages.getProperty('textContent')).jsonValue()).split(' / ')[1]);

    browser.close();

    let pageLinks = [];
    for(let i = 1; i <= totalPages; i++){
        pageLinks.push(`https://www.nuuly.com/rent/browse/all?pageNumber=${i}`);
    }

    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 32,
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

    cluster.on('taskerror', (err, data) => {
        console.log(`Error crawling ${data}: ${err.message}`);
    });

    await cluster.task(async ({ page, data: url }) => {
        await page.goto(url, {waitUntil: "load"});
        const productHandles = await page.$$('div.o-row.c-catalog-page__grid > .o-extra-small--6')
        for(const product of productHandles) {
            try {
                const productLink = await page.evaluate(el => el.querySelector('div > a').href, product);
                fs.appendFile('links.txt', `${productLink}\n`, function (err) {
                    if (err) throw err;
                });
            } catch (error) {
                console.log(error);
            }
        }
    });

    for(const link of pageLinks){
        await cluster.queue(link);
    }

    await cluster.idle();
    await cluster.close();
})();