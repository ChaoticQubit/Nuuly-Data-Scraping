let userDetails = await page.evaluate(() => {
    let users = [];
    let user_data = {};
    let usernames = document.getElementsByClassName('c-product-review-user-info__username');
    let details = document.getElementsByClassName('c-product-review-user-info__details');
    for (var user of usernames){
        users.push(user.textContent);
    }
    for (var detail of details){
        user_data['details'] = detail.textContent;
    }
    return [users, user_data];
});

fs.appendFile('reviews.txt', `${userDetails}\n`, function (err) {
    if (err) throw err;
});

// for(const review of reviews) {
//     try {
//         const reviewPostedByUser = await page.evaluate(el => el.querySelector('h5.c-product-review-user-info__username').textContent, review);
//         const userDetails = await page.evaluate(el => el.querySelector('p.c-product-review-user-info__details').textContent, review);
//         fs.appendFile('reviews.txt', `${reviewPostedByUser}, ${texts}\n`, function (err) {
//             if (err) throw err;
//         });
//     } catch (error) {
//         console.log(error);
//     }
// }




// const userSize = (await page.evaluate(el => el.querySelector('div > p:nth-child(1)').textContent, review)).split(': ')[1];
                // const userDressColor = (await page.evaluate(el => el.querySelector('div > p:nth-child(2)').textContent, review)).split(': ')[1];
                // const userHeight = (await page.evaluate(el => el.querySelector('div > p:nth-child(3)').textContent, review)).split(': ')[1];
                // const userBodyType = (await page.evaluate(el => el.querySelector('div:nth-child(2) > p:nth-child(1)').textContent, review)).split(': ')[1];
                // const userBraSize = (await page.evaluate(el => el.querySelector('div:nth-child(2) > p:nth-child(2)').textContent, review)).split(': ')[1];

                // resultSet["reviews"].push(
                //     {
                //         "review_posted_by_username": userName,
                //         "user_size": userSize,
                //         "user_dress_color": userDressColor,
                //         "user_height": userHeight,
                //         "user_body_type": userBodyType,
                //         "user_bra_size": userBraSize
                //     }
                // );