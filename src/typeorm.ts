import {
    Connection,
    createConnection,
    DefaultNamingStrategy,
    useContainer,
} from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { snakeCase } from 'typeorm/util/StringUtils';
import { Container } from 'typedi';

let connection: Connection;

async function connect(): Promise<Connection> {
    const options: PostgresConnectionOptions = {
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT),
        username: process.env.DATABASE_USER,
        database: process.env.DATABASE_NAME,
        password: process.env.DATABASE_PASSWORD,
        synchronize: false,
        entities: [__dirname + '/entities/*'],
        namingStrategy: new NamingStrategy(),
    };

    useContainer(Container);
    connection = await createConnection(options);

    return connection;
}

class NamingStrategy extends DefaultNamingStrategy {
    columnName(
        propertyName: string,
        customName: string,
        embeddedPrefixes: string[]
    ): string {
        if (embeddedPrefixes.length) {
            return (
                snakeCase(embeddedPrefixes.join('_')) +
                (customName ? snakeCase(customName) : snakeCase(propertyName))
            );
        }
        return customName ? customName : propertyName;
    }
}

export { connect };
