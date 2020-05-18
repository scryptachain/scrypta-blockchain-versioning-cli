#!/usr/bin/env node

var ScryptaBVC = require('../lib/index.js')

var args = process.argv.splice(process.execArgv.length + 2);
var command = args[0];
const console = require('better-console')

switch(command){
    
    case "importkey":
        if(args[1] !== undefined && args[2] !== undefined){
            let privatekey = args[1]
            let passphrase = args[2]
            ScryptaBVC.importkey(privatekey, passphrase)
        }else{
            console.log('Please define a private key to import')
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

    case "hash":
        if(args[1] !== undefined){
            let folder = args[1]
            ScryptaBVC.hashfolder(folder)
        }else{
            ScryptaBVC.hashfolder('./')
        }
    break;

    case "publish":
        if(args[1] !== undefined && args[2] !== undefined){
            let folder = args[1]
            if(args[2] !== undefined){
                let passphrase = args[2]
                ScryptaBVC.publishfolder(folder, passphrase)
            }else{
                console.error('Passphrase not defined, use the command like `scrypta-bvc Folder Passphrase`')
            }
        }else{
            if(args[1] !== undefined){
                let passphrase = args[1]
                ScryptaBVC.publishfolder('./', passphrase)
            }else{
                console.error('Passphrase not defined, use the command like `scrypta-bvc Passphrase`')
            }
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