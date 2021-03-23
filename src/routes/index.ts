import * as express from 'express';

const router = express.Router();

router.get('/', function(req, res) {
    return res.json({
        status: 200,
        message: "lol wat r u doin here??"
    })
})

export default router;