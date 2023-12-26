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