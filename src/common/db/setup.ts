import {Sequelize} from "sequelize";

import * as user from './models/User.js';

export const setupMappings = (db: Sequelize) => {
    user.init(db);

    user.associate();
}
