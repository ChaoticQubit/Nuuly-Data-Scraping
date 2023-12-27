const { Cluster } = require('puppeteer-cluster');
const { cssSelectors } = require('./data/css_selectors');
var fs = require('fs');

(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_BROWSER,
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
        let productDetails = {};
        try{
            await page.goto(url, {waitUntil: "load"});

            productDetails["product_link"] = url;
            productDetails["product_name"] = await page.$eval('h1', el => el.textContent);
            productDetails["product_description"] = await page.$eval('div.c-product-details__content', el => el.textContent);
            productDetails["product_price"] = parseInt((await page.$eval('span.c-product-info-header__msrp', el => el.textContent)).split(': $')[1]);

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
            const reviews = (await page.$$(cssSelectors.REVIEW_CARD_CONTAINER)).splice(3);

            let reviewsRes = {"reviews": []};
            for(const review of reviews){
                const userName = await page.evaluate(el => el.querySelector('div > h5').textContent, review);
                const pTags = await page.evaluate(review => {
                    const paragraphs = review.querySelectorAll('div > p');
                    return Array.from(paragraphs).map(p => p.textContent.trim());
                }, review);

                const reviewDate = await page.evaluate(el => el.querySelector("span.c-product-review-card__rating-date").textContent, review);
                const reviewTitle = await page.evaluate(el => el.querySelector('div > h4').textContent, review);
                const reviewText = pTags.pop();

                const starRatings = await page.evaluate(review => {
                    const stars = review.querySelectorAll("span.c-icon--color-primary.c-star-rating__star");
                    return Array.from(stars).map(s => {
                        if(s.classList.contains('c-icon--color-primary')){
                            return 1;
                        }else{
                            return 0;
                        }
                    });
                }, review);

                reviewsRes["reviews"].push(
                    {
                        "review_posted_by_username": userName,
                    }
                );

                for(let tag of pTags){
                    tag = tag.split(': ');
                    tag[0] = "user_" + tag[0].replace(' ', '_').toLowerCase();
                    reviewsRes["reviews"][reviewsRes["reviews"].length - 1][tag[0]] = tag[1];
                }

                reviewsRes["reviews"][reviewsRes["reviews"].length - 1]["review_date"] = reviewDate;
                reviewsRes["reviews"][reviewsRes["reviews"].length - 1]["review_title"] = reviewTitle;
                reviewsRes["reviews"][reviewsRes["reviews"].length - 1]["review_text"] = reviewText;
                reviewsRes["reviews"][reviewsRes["reviews"].length - 1]["star_ratings"] = starRatings.length;
            }

            productDetails["reviews"] = reviewsRes["reviews"];

            let productData = fs.readFileSync("reviews.json","utf-8");
            let products = JSON.parse(productData);
            products.push(productDetails);
            fs.writeFileSync("reviews.json", JSON.stringify(products, null, 2));
        }
    });

    for(const link of productLinks.splice(0, 100)){
        await cluster.queue(link);
    }

    await cluster.idle();
    await cluster.close();
})();