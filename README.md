[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/subsquid/squid-abi-template)

# Squid ABI template

An experimental template is used to generate a squid that indexes EVM logs and transactions of choice from a contract address. Supports automatic ABI lookups for public contracts using the Etherscan API

## Usage

0. Install the [Squid CLI](https://docs.subsquid.io/squid-cli/):

```sh
npm i -g @subsquid/cli
```

1. Init the template and install the dependencies

```bash
sqd init my-abi-squid --template https://github.com/subsquid/squid-abi-template
cd my-abi-squid
npm i
```

2. Run `sqd generate` with the appropriate flags.

```bash
Usage: sqd generate [options]

Options:
  --address <contract>      contract address
  --archive <url>           archive endpoint 
  --abi <path>              (Optional) path or URL to the abi file. If omitted, the Etherscan API is used.
  -e, --event <name...>     one or multiple events to be indexed. '*' will index all events
  -f, --function <name...>. one or multiple contract functions to be indexed. '*' will index all functions
  --from <block>            start indexing from the given block. 
  --etherscan-api <url>     (Optional) an Etherscan-compatible API to fetch contract ABI by a known address. Default: https://api.etherscan.io/
```

3. Build and run the squid

```bash
sqd build
sqd up
sqd migration:generate
sqd process
```
The indexing will start.

In a separate window, start the GraphQL API server at `localhost:4350/graphql`:
```bash
sqd serve
```

4. Inspect `schema.graphql`, `src/processor.ts` and start hacking!

For more details on how to build and deploy a squid, see the [docs](https://docs.subsquid.io).

## Example
### Generate
```bash
npx squid-gen-abi \
--address 0x2E645469f354BB4F5c8a05B3b30A929361cf77eC \
--archive https://eth.archive.subsquid.io \
--event NewGravatar \
--event UpdatedGravatar \
--function createGravatar \
--from 6000000
```
### Explore
```gql
query MyQuery {
  events(orderBy: block_timestamp_ASC) {
    id
    name
    block {
      number
      timestamp
    }
    ... on NewGravatarEvent {
      id0
      imageUrl
      owner
    }
    ... on UpdatedGravatarEvent {
      id0
      imageUrl
      owner
    }
  }
}
```
<img width="1000" alt="Example" src="https://user-images.githubusercontent.com/61732514/214889375-20cd1945-0124-4924-a1dd-3f1a07ddd6ab.png">

