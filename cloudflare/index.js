import handleReq from "../collect-recipe.js";

export default {
    async fetch(request) {
        let response = new ResponseShim();
        await handleReq(request, response);
        return response.data;
    },
};

class ResponseShim {
    options = {status: 200, headers: {}};
    data = null;

    setHeader(name, value) {
        this.options.headers[name] = value;
    }

    status(num) {
        this.options.status = num;
        return this;
    }

    send(message) {
        if (typeof message === 'string') {
            this.data = new Response(message, this.options)
        } else {
            this.data = Response.json(message, this.options);
        }
    }
}
