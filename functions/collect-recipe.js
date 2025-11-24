export default (req, res) => {
    try {
        if (!req.url.includes('?')) throw 400;
        let recipeUrl = new URL(req.url.slice(req.url.indexOf('?') + 1));
        if (recipeUrl.protocol !== 'https:' && recipeUrl.protocol !== 'http:') throw 400;
        fetch(recipeUrl, {headers: {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0"}}).then(r => r.text()).then(t => {
            let matches = t.matchAll(/<script\s[^>]*\btype=['"]?application\/ld\+json['"]?\b[^>]*>\s*({.+?}|\[.+?\])\s*<\/script>/gs);
			res.status(404).send([t]);
			return;
            for (let [_, json] of matches) {
                try {
                    let obj = JSON.parse(json);
                    let recipe = findRecipe(obj);
                    if (recipe) {
                        res.status(200).send(recipe);
                        return;
                    }
                } catch {}
            }
            res.sendStatus(404);
		});
    } catch {
        res.sendStatus(400);
    }
}

function findRecipe(obj) {
    if (Array.isArray(obj)) {
        for (let o of obj) {
            let recipe = findRecipe(o);
            if (recipe) return recipe;
        }
        return null;
    }
    let type = obj?.['@type'];
    if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) {
        return obj;
	} else if (obj?.['@graph']) {
        for (let o of obj['@graph']) {
            let recipe = findRecipe(o);
            if (recipe) return recipe;
        }
    }
    return null;
}
