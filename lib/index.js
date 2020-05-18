const ScryptaCore = require('@scrypta/core')
const scrypta = new ScryptaCore
const { hashElement } = require('folder-hash')
const CryptoJS = require('crypto-js')
const console = require('better-console')
const fs = require('fs')

var use = async function(address) {
    let identity = await scrypta.returnIdentity(address)
    if(identity !== false){
        await scrypta.setDefaultIdentity(address)
        let identity = await scrypta.returnDefaultIdentity()
        console.log('Identity ' + identity.address + ' selected correctly')
    }else{
        console.error('Identity doesn\'t exist in wallet, please import with `scrypta-bvc importkey PrivateKey Passphrase`')
    }
};

var importkey = async function(privatekey, passphrase) {
    try{
        let identity = await scrypta.importPrivateKey(privatekey, passphrase)
        if(identity !== false){
            console.log('Identity imported correctly')
        }else{
            console.error('Please be sure Private Key is valid')
        }
    }catch(e){
        console.error('Please be sure Private Key is valid')
    }
};

var hashfolder = function(folder) {
    return new Promise(async response => {
        var options = {
            folders: { exclude: ['.*', 'node_modules', 'db'] },
            files: { include: ['*.*'] }
        }
        if (fs.existsSync(folder + '/scrypta-manifest.json')) {
            let manifest = JSON.parse(fs.readFileSync(folder + '/scrypta-manifest.json'))
            if(manifest.options !== ''){
                options = manifest.options
            }
        }
        hashElement(folder, options).then(hash => {
            let sha256 = CryptoJS.SHA256(hash.hash).toString(CryptoJS.enc.Hex)
            hash.sha256 = sha256
            console.log(JSON.stringify(hash))
            response(hash)
        }).catch(error => {
            console.error(error)
            response(error)
        })
    })
};

var initfolder = function(folder) {
    fs.writeFileSync(folder + 'scrypta-manifest.json', 
        `{
    "version": "1.0.0",
    "name": "",
    "alias": "",
    "options": {
        "folders": { "exclude": [".*", "node_modules", "db"] },
        "files": { "include": ["*.*"] }
    },
    "address": ""
}`);        
};

var verifyfolder = function(folder) {
    return new Promise(async response => {
        if (fs.existsSync(folder + '/scrypta-manifest.json')) {
            let manifest = JSON.parse(fs.readFileSync(folder + '/scrypta-manifest.json'))
            if(manifest.address !== ''){
                console.log('Starting verification with the blockchain.')
                let written = await scrypta.post('/read', {address: manifest.address})
                // TODO: verify if version exist in the blockchain and hash is the same
            }else{
                console.error('Address not defined in manifest file.')
            }
        }else{
            console.error('Can\'t find scrypta-manifest.json file.')
            response(false)
        }
    })
};

var publishfolder = function(folder, passphrase) {
    return new Promise(async response => {
        if (fs.existsSync(folder + '/scrypta-manifest.json')) {
            let manifest = JSON.parse(fs.readFileSync(folder + '/scrypta-manifest.json'))
            let identity = await scrypta.returnIdentity(manifest.address)
            if(identity !== false){
                await scrypta.setDefaultIdentity(manifest.address)
                let identity = await scrypta.returnDefaultIdentity()
                console.log('Identity ' + identity.address + ' selected correctly')
                
                if(manifest.address !== ''){
                    console.log('Checking if exist genesis manifest.')
                    let init = await scrypta.post('/read', {address: manifest.address, refID: 'genesis'})
                    if(init[0] !== undefined){
                        let genesis = init[0]
                        if(genesis.name === manifest.name && genesis.address === manifest.address){
                            // TODO: WRITE UPDATE
                        }else{
                            console.error('Genesis transaction doesn\'t match, please be sure you\'re using right address and folder.')
                        }
                    }else{
                        console.log('Publishing genesis transaction.')
                        // TODO: WRITE GENESIS
                        let balance = await scrypta.get('/balance/' + identity.address)
                        if(balance.balance >= 0.001){
                            let genesis = JSON.stringify(manifest)
                            console.log('You have ' + balance.balance + ' LYRA')
                            let readkey = await scrypta.readKey(passphrase, identity.wallet)
                            if(readkey !== false){
                                console.log('Passphrase is valid')
                                // await scrypta.write(identity.wallet, passphrase)
                            }else{
                                console.error('Passphrase is not valid')
                            }
                        }else{
                            console.error('Not enough balance in address, you have ' + balance.balance + ' LYRA')
                        }
                    }
                }else{
                    console.error('Address not defined in manifest file.')
                }
            }else{
                console.error('Identity ' + manifest.address + ' doesn\'t exist in wallet, please import with `scrypta-bvc importkey PrivateKey Passphrase`')
            }
        }else{
            console.error('Can\'t find scrypta-manifest.json file.')
            response(false)
        }
    })
};

exports.use = use
exports.importkey = importkey
exports.hashfolder = hashfolder
exports.initfolder = initfolder
exports.verifyfolder = verifyfolder
exports.publishfolder = publishfolder