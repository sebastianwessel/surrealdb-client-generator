# SurrealDB Client & Zod Schema Generator

 SurrealDB Schema Generator is a handy tool that simplifies the process of generating [zod](http://zod.dev) schemas and TypeScript clients for [SurrealDB](http://surrealdb.com) based on your provided database schema.
 Its primary purpose is to offer a fundamental starting point, not to replace a full-blown automated ORM.

## Features

- Generate zod schemas and TypeScript clients for SurrealDB.
- Utilize your existing database schema created with excellent tools like [surrealist.app](https://surrealist.app/).
- Benefit from a user-friendly **Designer** in Surrealist to craft your data model effortlessly.
- Export your schema from Surrealist and use it with this tool.
- Choose to generate only zod schemas or include a basic TypeScript client.
- Utilize zod schemas for [CIRQL](https://cirql.starlane.studio/) if needed.

## 🚨 Warning Version 2.x

Version 2 has breaking changes!  
The tool now uses `surrealdb.js` instead of `surrealdb.node` for interacting with a SurrealDB instance.

The change was made, because it seems that `surrealdb.js` is closer to the SurrealDB development process and more up to date in general.

This means, the option "memory" for connections is no longer available, and you need to run against a real running SurrealDB instance (use docker).

## How It Works

1. If you provide a surql schema file:
 - An in-memory SurrealDB instance is automatically created.
 - The schema is loaded into this temporary instance.
2. If no schema file is provided:
 - SurrealDB Schema Generator connects to your specified database.
3. The generator extracts the `DEFINE` information from the connected database (either in-memory or external).
4. Based on the definitions found in the database, the zod schemas are generated.


Enjoy using SurrealDB Schema Generator to streamline your schema generation process for SurrealDB and zod.
It's designed to make your life easier when working with these powerful technologies.

## Installation

You can directly execute the generation:

```bash
npx surql-gen
```

Or you can install the generator as dependency into your project.

```bash
npm i -D @sebastianwessel/surql-gen
```

In case you install the generator as dependency or you installed it globally, you can call directly `surql-gen`

## How to Use

Configuring options for this tool is flexible and convenient. You have two main methods to choose from:

1. **Config JSON File**: You can easily set your options through a simple config JSON file.

2. **Command Line Interface (CLI)**: Alternatively, you can configure the options directly via the command line.

And the best part? You can use both methods simultaneously if it suits your needs. In such cases, the tool intelligently merges the parameters, giving priority to the ones provided through the CLI.
This means you have complete control over your configuration, adapting it to your preferences effortlessly.

```bash
Usage: surql-gen [options]

Generate zod schema and typescript client code from running Surreal database

Options:
  -V, --version         output the version number
  -f, --schemaFile      a SurrealQL file containing the definitions (default: myschema.surql)
  -c, --config           config file (default: surql-gen.json)
  -s, --surreal         SurrealDB connection url (default: http://localhost:8000)
  -u, --username        auth username (default: root)
  -p, --password        auth password (default: root)
  -n, --ns              the namspace (default: test)
  -d, --db              the database (default: test)
  -o, --outputFolder    output folder (default: client_generated)
  -g, --generateClient  generate client (default: true)
  --no-generateClient   no client generation
  -h, --help            display help for command
```

## Config file

You can provide the configuration via a config file.
The config file is using same paramaters as the cli.

Example:

```json
{
  "schemaFile": "schema.surql",
  "surreal": "memory",
  "username": "root",
  "password": "secret_password",
  "ns": "my_namespace",
  "db": "my_database",
  "outputFolder": "./out",
  "generateClient": true,
  "lib": "surrealdb.js"
}
```

## Using a Schema File

If a schema file is provided an in-memory SurrealDB instance is created and the schema is loaded into this instance, no connection to a real SurrealDB instance is needed.

To use a schema file either provide the -f flag:
```bash
surql-gen -f ./path/to/your/schema.surql
 ```

or you can specify the path in the config file:
```json
{
  "schemaFile": "./path/to/your/schema.surql"
}
```

## Connecting to an Existing SurrealDB Instance

To connect to an existing SurrealDB instance, simply omit the `-f` option, or omit the `schemaFile` in the config file.

In this case, you need to provide the connection information for your running instance.

## Code Generation Structure

The generated code is organized into two distinct parts for your convenience:

### `_generated` Subfolder

In this subfolder, you'll find schema information and other generated code that may be overwritten during subsequent runs of the tool. Here's how it works:

- **Table Definition Overwrite**: If the tool detects a table definition and an existing `_generated` folder, it replaces the old folder with a new one. This ensures that you're always working with the latest generated code.

- **Folder Retention**: If there's a folder for a table that no longer exists in the current run, it won't be automatically deleted. This approach gives you the flexibility to manage your codebase and project structure according to your preferences, allowing you to keep your work organized.

### Other Generated Subfolders

Apart from the `_generated` folder, additional subfolders are created during the initial execution of the tool.
These subfolders are not overwritten or modified in subsequent runs.
They serve as safe spaces for your customizations, changes, and enhancements:

**Customization Freedom**: You can confidently make modifications and enhancements in these subfolders without worrying about them being altered by future executions of the tool.
This design allows you to tailor the generated code to your project's specific requirements, ensuring a seamless development experience.

## Mapping

### Basic Type

| SurrealQL | Zod (input)  | Zod (output) |
|-----------|---|---|
| TYPE number  | z.number()  | z.number() |
| TYPE option\<number\>  | z.number().optional()  | z.number().optional() |
| TYPE string  | z.string()  | z.string() |
| TYPE option\<string\>  | z.string().optional()  | z.string().optional() |
| TYPE datetime  | z.string().datetime()  | z.string().datetime() |
| TYPE option\<datetime\>  | z.string().datetime().optional()  | z.string().datetime().optional() |
| TYPE bool  | z.boolean()  | z.boolean() |
| TYPE option\<bool\>  | z.boolean().optional()  | z.boolean().optional() |
| TYPE object  | z.object({})  | z.object({}) |
| TYPE option\<object\>  | z.object({}).optional()  | z.object({}).optional() |
| TYPE array  | z.array()  | z.array(z.any()) |
| TYPE option\<array\>  | z.array(z.any()).optional()  | z.array(z.any()).optional() |
| TYPE array\<string\>  | z.array()  | z.array(z.string()) |
| TYPE option\<array\<string\>\>  | z.array(z.string()).optional()  | z.array(z.string()).optional() |
| TYPE array\<number\>  | z.array()  | z.array(z.number()) |
| TYPE option\<array\<number\>\>  | z.array(z.number()).optional()  | z.array(z.number()).optional() |
| TYPE array\<bool\>  | z.array()  | z.array(z.boolean()) |
| TYPE option\<array\<bool\>\>  | z.array(z.boolean()).optional()  | z.array(z.boolean()).optional() |
| TYPE record  | z.any()  | z.any() |
| TYPE option\<record\>  | z.any()  | z.any() |

---

If you like this tool, I please you, to give a star ⭐️ on github:
👉  [https://github.com/sebastianwessel/surrealdb-client-generator](https://github.com/sebastianwessel/surrealdb-client-generator)

If you run into an issue, please let me know so it can get fixed.
👉  [https://github.com/sebastianwessel/surrealdb-client-generator/issues](https://github.com/sebastianwessel/surrealdb-client-generator/issues)

**Good luck with your project. 👋 Cheers, and happy coding!**
