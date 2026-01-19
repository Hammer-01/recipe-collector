export default async (req, res) => {
    try {
        if (!req.url.includes('?')) throw "Bad request";
        let recipeUrl = new URL(req.url.slice(req.url.indexOf('?') + 1));
        if (recipeUrl.protocol !== 'https:' && recipeUrl.protocol !== 'http:') throw "URL must start with http: or https:";
        let headers = {};
		let debugProbe = 'fallback';
        if (req.headers instanceof Headers && req.headers.has('User-Agent')) { // req instanceof Request
			debugProbe = 'req.headers instanceof Headers => cloudflare';
            headers['User-Agent'] = req.headers.get('User-Agent');
        } else if (req.headers['user-agent']) { // req instanceof http.IncomingMessage
			debugProbe = 'req.headers["user-agent"] => nhost';
            headers['User-Agent'] = req.headers['user-agent'];
        } else {
            // release cycle = 4 weeks = 4 * 7 * 24 * 60 * 60 * 1000 = 2419200000 ms
            let currentFirefoxVersion = Math.floor((Date.now() - new Date("2025-11-11")) / 2419200000) + 145;
            headers['User-Agent'] = `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${currentFirefoxVersion}.0) Gecko/20100101 Firefox/${currentFirefoxVersion}.0`;
        }
		if (recipeUrl.hostname === 'www.kidspot.com.au') {
			recipeUrl = 'https://tags.news.com.au/prod/newskey/generator.html?origin=' + encodeURIComponent(recipeUrl);
			headers['Cookie'] = 'n_regis=123456789';
		}
        await fetch(recipeUrl, {headers}).catch(() => {
			throw "Unable to access given url";
		}).then(r => r.text()).then(t => {
            let matches = t.matchAll(/<script\s[^>]*\btype=['"]?application\/ld\+json['"]?\b[^>]*>\s*({.+?}|\[.+?\])\s*<\/script>/gs);
            for (let [_, json] of matches) {
                try {
                    let obj = JSON.parse(json.replaceAll('\r', '').replaceAll('\n', ''));
                    let recipe = findRecipe(obj);
                    if (recipe) {
						recipe = {...recipe, debugProbe};
                        res.status(200).send(recipe);
                        return;
                    }
                } catch {}
            }
            res.status(404).send("Unable to find recipe on the given page", + " - " + debugProbe);
		});
    } catch (err) {
		if (err instanceof Error) err = err.message || err;
        res.status(400).send(err);
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
