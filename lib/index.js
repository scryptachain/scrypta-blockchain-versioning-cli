const ScryptaCore = require('@scrypta/core')
const scrypta = new ScryptaCore
const { hashElement } = require('folder-hash')
const CryptoJS = require('crypto-js')
const console = require('better-console')
const fs = require('fs')

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

function uploadfile(buffer){
    return new Promise(async response => {
        try{
            var ipfs = await scrypta.post('/ipfs/add', {buffer: buffer}, 'http://localhost:3001')
            if(ipfs.data !== undefined){
                response(ipfs)
            }else{
                response(false)
            }
        }catch(e){
            response(false)
        }
    })
}

var uploadfolder = function(folder) {
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
        hashElement(folder, options).then(async hash => {
            for(let x in hash.children){
                let entry = hash.children[x]
                if(entry.children !== undefined){
                    console.log('Upload subfolder ' + folder + '/' + entry.name)
                    let hashedfolder = await uploadfolder(folder + '/' + entry.name)
                    hash.children[x] = hashedfolder
                }else{
                    console.log('Uploading file ' + folder + '/' + entry.name)
                    let buffer = fs.readFileSync(folder + '/' + entry.name)
                    let hexed = buffer.toString('hex')
                    let uploaded = false
                    while(!uploaded){
                        let ipfs = await uploadfile(hexed)
                        if(ipfs !== false && ipfs.data !== undefined){
                            console.log('IPFS hash is ' + ipfs.data[0].hash)
                            hash.children[x].ipfs = ipfs.data[0].hash
                            uploaded = true
                        }else{
                            console.log('Can\'t upload ' + entry.name)
                        }
                    }
                }
            }
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
                let bc_version = await scrypta.post('/read', {address: manifest.address, refID: manifest.version, protocol: 'bvc://'})
                if(bc_version !== undefined && bc_version.data[0] !== undefined){
                    let version = bc_version.data[0].data
                    let hash = await hashfolder(folder)
                    if(version.sha256 === hash.sha256){
                        console.log('Code is verified correctly with blockchain.')
                    }else{
                        console.error('Your local files are different from blockchain.')
                    }
                }else{
                    console.error('Nothing found at address ' + manifest.address + ' for version ' + manifest.version + '.')
                }
            }else{
                console.error('Address not defined in manifest file.')
            }
        }else{
            console.error('Can\'t find scrypta-manifest.json file.')
            response(false)
        }
    })
};

var publishfolder = function(folder, passphrase, uploadIPFS = false) {
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
                    let genesis_check = await scrypta.post('/read', {address: manifest.address, refID: 'genesis', protocol: 'bvc://'})
                    if(genesis_check.data[0] !== undefined){
                        let genesis = genesis_check.data[0].data
                        if(genesis.name === manifest.name && genesis.address === manifest.address){
                            console.log('Genesis exist, check if exist version.')
                            let version_check = await scrypta.post('/read', {address: manifest.address, refID: manifest.version, protocol: 'bvc://'})
                            if(version_check.data[0] === undefined){
                                console.log('Calculating hash and uploading new version.')
                                let hash
                                if(!uploadIPFS){
                                    hash = await hashfolder(folder)
                                }else{
                                    hash = await uploadfolder(folder)
                                }
                                let balance = await scrypta.get('/balance/' + identity.address)
                                if(balance.balance >= 0.001){
                                    console.log('You have ' + balance.balance + ' LYRA')
                                    let readkey = await scrypta.readKey(passphrase, identity.wallet)
                                    if(readkey !== false){
                                        console.log('Passphrase is valid')
                                        let written = await scrypta.write(identity.wallet, passphrase, JSON.stringify(hash), '', manifest.version, 'bvc://')
                                        if(written.uuid !== undefined){
                                            console.log('Update transaction written correctly, version in blockchain now is ' + manifest.version + '.')
                                        }else{
                                            console.error('Error while creating genesis transaction, retry.')
                                        }
                                    }else{
                                        console.error('Passphrase is not valid')
                                    }
                                }else{
                                    console.error('Not enough balance in address, you have ' + balance.balance + ' LYRA')
                                }
                            }else{
                                console.error('Version exist, please increment version in scrypta-manifest.json file.')
                            }
                        }else{
                            console.error('Genesis transaction doesn\'t match, please be sure you\'re using right address and folder.')
                        }
                    }else{
                        console.log('Publishing genesis transaction.')

                        let balance = await scrypta.get('/balance/' + identity.address)
                        if(balance.balance >= 0.002){
                            let genesis = JSON.stringify(manifest)
                            console.log('You have ' + balance.balance + ' LYRA')
                            let readkey = await scrypta.readKey(passphrase, identity.wallet)
                            if(readkey !== false){
                                console.log('Passphrase is valid')
                                let genesis_written = await scrypta.write(identity.wallet, passphrase, genesis, '', 'genesis', 'bvc://')
                                if(genesis_written.uuid !== undefined){
                                    console.log('Genesis transaction written correctly.')
                                    let hash = await hashfolder(folder)
                                    let version_written = await scrypta.write(identity.wallet, passphrase, JSON.stringify(hash), '', manifest.version, 'bvc://')
                                    if(version_written.uuid !== undefined){
                                        console.log('Version transaction written correctly.')
                                    }else{
                                        console.error('Error while creating version transaction, retry.')
                                    }
                                }else{
                                    console.error('Error while creating genesis transaction, retry.')
                                }
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

exports.importkey = importkey
exports.hashfolder = hashfolder
exports.initfolder = initfolder
exports.verifyfolder = verifyfolder
exports.publishfolder = publishfolder
exports.uploadfolder = uploadfolder