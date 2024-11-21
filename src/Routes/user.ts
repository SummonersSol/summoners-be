import { Router } from 'express';
import * as UserController from '../Controllers/UserController';
import { contentUpload } from './Upload';
import { checkAllowedMime, verifySignature } from '../../utils';
import _ from 'lodash';
import DB from '../DB';
import moment from 'moment';
export const routes = Router();

//
routes.post('/', async(req, res) => {
    let data = req.body;

    if(!data) {
        return res.status(400).send("No data");
    }

    if(!data.address /* || !data.name */) {
        return res.status(400).send("Invalid params");
    }
    
    let result = await UserController.create({
        address: data.address,
        // name: data.name,
    });

    if(!result) {
        return res.status(500).send("Server Error");
    }

    let users = await UserController.find({ id: result.id });

    if(!users || users.length === 0) {
        return res.status(500).send("Server Error");
    }

    return res.send({
        success: true,
        message: "Success",
        data: users[0],
    });
});

/* routes.post('/update/:id', contentUpload.single('profile_picture'), async(req, res) => {
    let data = req.body;
    let {address, signature, message} = data;
    let id = parseInt(req.params.id);

    if(!data) {
        return res.status(400).send("No data");
    }

    if(!data.address) {
        return res.status(400).send("Invalid params");
    }

    // for multipart
    let verified = verifySignature(address, signature, message);
    if(!verified) {
        return res.status(401).send("Unauthorized");
    }

    const mime = req.file?.mimetype;

    // delete file if not in whitelist
    if (mime && !checkAllowedMime(mime, ['image'])) {
        await fs.remove(req.file?.path!);
    }

    // assign profile_picture params if valid
    if (_.has(req, 'file')) {
        data.profile_picture = req.file?.filename;
    }

    // cant save address
    data = _.omit(data, ['address', 'signature']);

    if(Object.keys(data).length === 0){
        return res.status(400).send("No new updates");
    }

    let user = await UserController.view(id);
    if(!user) {
        return res.status(404).send("Unable to find user");
    }

    // not the same address
    if(user.address !== address) {
        return res.status(401).send("Unauthorized");
    }

    let updateRes = await UserController.update(id, data);
    if(updateRes && typeof updateRes === 'string') {
        return res.status(400).send((updateRes as string).includes("duplicate")? 'Username is claimed, please choose another!' : "Unknown Error");
    }
    
    return res.send({
        success: true,
        message: "Success",
    });

}); */

routes.post('/me', async(req, res) => {
    let data = req.body;

    if(!data) {
        return res.status(400).send("No data");
    }

    if(!data.address) {
        return res.status(400).send("Invalid params");
    }
    
    let user = await UserController.findByAddress(data.address);
    if(!user) {
        return res.status(404).send("Unable to find user.");
    }

    await UserController.update(user.id, { last_connected_at: moment().format('YYYY-MM-DD HH:mm:ss') });

    return res.send({
        success: true,
        message: "Success",
        data: user
    });
});

routes.post('/me2', async(req, res) => {
    let data = req.body;

    if(!data) {
        return res.status(400).send("No data");
    }

    if(!data.userId) {
        return res.status(400).send("Invalid params");
    }
    
    let user = await UserController.view(Number(data.userId));
    if(!user) {
        return res.status(404).send("Unable to find user.");
    }

    await UserController.update(user.id, { last_connected_at: moment().format('YYYY-MM-DD HH:mm:ss') });

    return res.send({
        success: true,
        message: "Success",
        data: user
    });
});

// routes.post('/deposit_address', async(req, res) => {
//     let data = req.body;

//     if(!data) {
//         return res.status(400).send("No data");
//     }

//     if(!data.address) {
//         return res.status(400).send("Invalid params");
//     }
    
//     let user = await UserController.findByAddress(data.address);
//     if(!user) {
//         return res.status(404).send("Unable to find user.");
//     }

//     let account = getUserAccount(user.address);
//     return res.send({
//         success: true,
//         message: "Success",
//         data: account.publicKey.toBase58(),
//     });
// });