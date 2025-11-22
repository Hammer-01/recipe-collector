export default (req, res) => {
    try {
        if (!req.url.includes('?')) throw 400;
        let recipeUrl = new URL(req.url.slice(req.url.indexOf('?') + 1));
        if (recipeUrl.protocol !== 'https:' && recipeUrl.protocol !== 'http:') throw 400;
        res.status(200).send(`Collecting url: ${recipeUrl}`);
    } catch {
        res.sendStatus(400);
    }
}
