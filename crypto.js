const crypto = require("crypto-js");
const env = require("dotenv");

env.config();

const myPassword = 'demo';
const myKey = 'hitemhard';

const password = crypto.AES.encrypt(myPassword,myKey);
console.log('password :',password.toString());

const decryptedBytes = crypto.AES.decrypt(password, myKey);
const decrypted = decryptedBytes.toString(crypto.enc.Utf8);
console.log("Decrypted password:", decrypted);