# Scrypta Blockchain Versioning CLI

<p><a href="https://camo.githubusercontent.com/4e892209b4b1e2d1a773ec97e544a92f068a6f0b/68747470733a2f2f6d69726f2e6d656469756d2e636f6d2f6d61782f333136382f312a31674778414b57714b5135577a635170755f766932412e6a706567" target="_blank" rel="noopener noreferrer"><img style="display: block; margin-left: auto; margin-right: auto;" src="https://camo.githubusercontent.com/4e892209b4b1e2d1a773ec97e544a92f068a6f0b/68747470733a2f2f6d69726f2e6d656469756d2e636f6d2f6d61782f333136382f312a31674778414b57714b5135577a635170755f766932412e6a706567" alt="" data-canonical-src="https://miro.medium.com/max/3168/1*1gGxAKWqKQ5WzcQpu_vi2A.jpeg" /></a></p>
<p style="text-align: center;">&nbsp;&nbsp;<a title="English &mdash; Scrypta Wiki" href="https://en.scrypta.wiki/utilities/versioning.html" target="_blank" rel="nofollow noopener"><strong>Wiki English</strong></a>&nbsp;&middot; &middot; &middot;&nbsp;<a title="Italiano &mdash; Scrypta Wiki" href="https://it.scrypta.wiki/utilities/versioning.html" target="_blank" rel="nofollow noopener"><strong>Wiki italiano</strong></a></p>

This package has been created to maintain and verify code thanks to the blockchain. It's not an alternative to `git` but it can be used *with* `git` to create trustless open-source software.

## How it works

Scrypta BVC or `scrypta-bvc` is an `npm` module that must be installed globally:

```
npm i -g @scrypta/bvc
```

When you've installed it you can use it from any folder you desire to track with the blockchain.

First of all you need a Lyra address, you can obtain an address thanks to [https://web.manent.app](https://web.manent.app) or [https://id.scryptachain.org](https://id.scryptachain.org) or simply downloading the QT wallet and creating a new address.

After you've an address with at least `0.002 LYRA` you can import the private key with:

```
scrypta-bvc importkey YourPrivateKey AStrongPassphrase
```

## Init a new folder

When you've created a new project (it doesn't matter what's the  programming language or if it's a software at all) you can enter the folder and init the project with a `scrypta-manifest.json` file like this:

```
cd myAwesomeProject
scrypta-bvc init
```

This will create a new file called `scrypta-manifest.json` like this one:

```
{
    "version": "1.0.0",
    "name": "",
    "alias": "",
    "options": {
        "folders": { "exclude": [".*", "node_modules", "db"] },
        "files": { "include": ["*.*"] }
    },
    "address": ""
}
```

You need to write all the blank fields with your informations:
- `name`: a name for the entire project
- `alias` a short alias for the project, it can be used in near future to globally check or download something from the blockchain
- `options`: includes and excludes options for `folder-hash` package. You can see usage here: [https://www.npmjs.com/package/folder-hash](https://www.npmjs.com/package/folder-hash)
- `address`: this is the Lyra address we imported before (not private key obviously)

## Publish updates

After we initializated our folder we can publish the hashed contents to the blockchain like this:

```
scrypta-bvc publish MyStrongPassphrase
```

This will create a genesis transaction with the entire `scrypta-manifest.json` file and will create first version, supposing `1.0.0`.

Any change to the version will allow to publish other versions, like 1.0.1 etc.

## Verify a folder

Supposing you've published your folder you can verify it simply with: 

```
cd myAwesomeProject
scrypta-bvc verify
```

If your file matches the blockchain one you will receive a success message, if they're different you will be notified about that and you should download it or simply don't trust the source.
