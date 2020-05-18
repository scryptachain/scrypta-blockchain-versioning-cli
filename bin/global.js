#!/usr/bin/env node

var ScryptaBVC = require('../lib/index.js')

var args = process.argv.splice(process.execArgv.length + 2);
var command = args[0];

switch(command){
    case "use":
        if(args[1] !== undefined){
            let address = args[1]
            ScryptaBVC.use(address)
        }else{
            console.log('Please define an address to use as identity')
        }
    break;

    case "importkey":
        if(args[1] !== undefined && args[2] !== undefined){
            let privatekey = args[1]
            let passphrase = args[2]
            ScryptaBVC.importkey(privatekey, passphrase)
        }else{
            console.log('Please define a private key to import')
        }
    break;

    case "hash":
        if(args[1] !== undefined){
            let folder = args[1]
            ScryptaBVC.hashfolder(folder)
        }else{
            ScryptaBVC.hashfolder('./')
        }
    break;

    case "init":
        if(args[1] !== undefined){
            let folder = args[1]
            ScryptaBVC.initfolder(folder)
        }else{
            ScryptaBVC.initfolder('./')
        }
    break;

    case "verify":
        if(args[1] !== undefined){
            let folder = args[1]
            ScryptaBVC.verifyfolder(folder)
        }else{
            ScryptaBVC.verifyfolder('./')
        }
    break;
}