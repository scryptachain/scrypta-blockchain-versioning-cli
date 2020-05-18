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
        console.error('Identity doesn\'t exist in wallet, please import with `scrypta-bvc import PrivateKey Passphrase`')
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
            }else{
                console.error('Address not defined in manifest file.')
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