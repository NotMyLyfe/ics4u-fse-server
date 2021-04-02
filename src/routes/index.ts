// index.ts
// Gordon Lin
// Main Express endpoint pointing to '/' that returns 200

// Imports Express module
import * as express from 'express';

// Declares new Express router
const router = express.Router();

// Gets all GET requests to '/' and returns a 200 status with a message
router.get('/', function(req, res) {
    return res.json({
        status: 200,
        message: "lol wat r u doin here??"
    })
})

// Exports router
export default router;
