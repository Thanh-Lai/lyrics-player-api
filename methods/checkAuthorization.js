const { API_KEY } = require('../secrets');

module.exports = function(apiKey) {
    if (!apiKey || apiKey !== API_KEY) {
        const error = apiKey ? 'Invalid' : 'No';
        return {error: {status: 401, message: `${error} api-key provided`}};
    }
    return true;
}
