# Contributing

Issues and pull requests are welcome!

## Prerequisites

Node 18 or greater is required to run the automated tests.

## Getting Started

1. Clone/fork the repository
1. Run `npm install` to install dependencies

## Test changes using the CLI

Run `npm run watch` to build the project and automatically rebuild when you make changes to the files in the [`src`](./src/) directory.

In a separate terminal, run `npm start onboard` to execute the `onboard` command.

## Test changes using the programmatic API

To test the `onboard` function, you can use the [`./test/onboard.ts`](./test/onboard.ts) file. Run `npm test` to run the tests.
