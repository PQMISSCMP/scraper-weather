module.exports = {
    "name": process.env.TYPEORM_NAME,
    "type": process.env.TYPEORM_TYPE,
    "host": process.env.TYPEORM_HOST,
    "port": process.env.TYPEORM_PORT,
    "username": process.env.TYPEORM_USERNAME,
    "password": process.env.TYPEORM_PASSWORD,
    "database": process.env.TYPEORM_DATABASE,
    "connectString" : `(DESCRIPTION = (ADDRESS = (PROTOCOL=TCP)(HOST=${process.env.TYPEORM_HOST})(PORT=${process.env.TYPEORM_PORT}))(CONNECT_DATA =(SID=${process.env.TYPEORM_DATABASE})))`,
    "entities": ["dist/src/infrastructure/persistence/entity/*.js"]
};
