export default (req, res) => {
    try {
        if (!req.url.includes('?')) throw 400;
        let recipeUrl = new URL(req.url.slice(req.url.indexOf('?') + 1));
        if (recipeUrl.protocol !== 'https:' && recipeUrl.protocol !== 'http:') throw 400;
        fetch(recipeUrl).then(r => r.text()).then(t => {
            let p = new DOMParser();
            let nodeList = p.parseFromString(t, 'text/html').querySelectorAll('script[type="application/ld+json"]');
            for (let node of nodeList.values()) {
                try {
                    let obj = JSON.parse(node.textContent);
                    let recipe = findRecipe(obj);
                    if (recipe) {
                        res.status(200).send(recipe);
                        return;
                    }
                } catch {}
            }
            res.sendStatus(404);
        );
    } catch {
        res.sendStatus(400);
    }
}

function findRecipe(obj) {
    if (obj?.['@type'] === 'Recipe') {
        return obj;
	} else if (obj?.['@graph']) {
        for (let o of obj['@graph']) {
            let recipe = findRecipe(o);
            if (recipe) return recipe;
        }
    }
    return null;
}
