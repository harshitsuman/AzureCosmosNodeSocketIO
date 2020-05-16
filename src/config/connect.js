const { CosmosClient } = require("@azure/cosmos");

const client = new CosmosClient({ endpoint : process.env.HOST, key:process.env.AUTH });

module.exports = client.database(process.env.DATABASE).container(process.env.CONTAINER);