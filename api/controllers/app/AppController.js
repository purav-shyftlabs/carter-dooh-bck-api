const { withController } = require('../../utils/controllerWrapper');

module.exports = {

    /**
     * Base path
     */

    ping: withController(async function (req, res) {
        return res.ok();
    }, { action: 'AppController.ping' })

};
