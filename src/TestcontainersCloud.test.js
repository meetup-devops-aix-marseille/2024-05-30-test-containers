const { Client } = require("pg");
const { PostgreSqlContainer } = require("@testcontainers/postgresql");
const {
  getContainerRuntimeClient,
} = require("testcontainers/build/container-runtime");
const { fail } = require("assert");

describe("GenericContainer", () => {
  beforeAll(async () => {
    const containerRuntime = await getContainerRuntimeClient();
    const info = containerRuntime.info;
    const { serverVersion } = info.containerRuntime;
    const isTestcontainersDesktop = serverVersion.includes(
      "Testcontainers Desktop"
    );
    if (!isTestcontainersDesktop) {
      fail();
    }
    console.log("Testcontainers Cloud via Testcontainers Desktop app");
  });

  describe("PostgreSQL", () => {
    let client;
    let container;
    beforeAll(async () => {
      const initScript = `
            create table guides
            (
                id    bigserial     not null,
                title varchar(1023) not null,
                url   varchar(1023) not null,
                primary key (id)
            );

            insert into guides(title, url)
            values ('Getting started with Testcontainers',
                    'https://testcontainers.com/getting-started/'),
                   ('Getting started with Testcontainers for Java',
                    'https://testcontainers.com/guides/getting-started-with-testcontainers-for-java/'),
                   ('Getting started with Testcontainers for .NET',
                    'https://testcontainers.com/guides/getting-started-with-testcontainers-for-dotnet/'),
                   ('Getting started with Testcontainers for Node.js',
                    'https://testcontainers.com/guides/getting-started-with-testcontainers-for-nodejs/'),
                   ('Getting started with Testcontainers for Go',
                    'https://testcontainers.com/guides/getting-started-with-testcontainers-for-go/'),
                   ('Testcontainers container lifecycle management using JUnit 5',
                    'https://testcontainers.com/guides/testcontainers-container-lifecycle/')
            ;
        `;

      container = await new PostgreSqlContainer("postgres:14-alpine")
        .withCopyContentToContainer([
          {
            content: initScript,
            target: "/docker-entrypoint-initdb.d/init.sql",
          },
        ])
        .start();
      client = new Client({
        connectionString: container.getConnectionUri(),
      });
      await client.connect();
    });

    afterAll(async () => {
      await client.end();
      await container.stop();
    });

    it("query postgresql container", async () => {
      const result = await client.query("SELECT COUNT(*) FROM guides");
      expect(result.rows[0]).toEqual({ count: "6" });
    });
  });
});
