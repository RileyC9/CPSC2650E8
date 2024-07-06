import sqlite3 from 'sqlite3';
import {mkdirp} from 'mkdirp';
import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userLoginSchema = new Schema({
  _id: { type: String, required: true },
  displayName: { type: String, required: true },
  name: {
    familyName: { type:String, required: true },
    givenName: { type:String, required: true }
  }
})

const model = mongoose.model('Oauth', userLoginSchema);

// mkdirp.sync('./var/db');

// var db = new sqlite3.Database('./var/db/todos.db');

// db.serialize(function() {
//   db.run("CREATE TABLE IF NOT EXISTS users ( \
//     id INTEGER PRIMARY KEY, \
//     username TEXT UNIQUE, \
//     hashed_password BLOB, \
//     salt BLOB, \
//     name TEXT \
//   )");
  
//   db.run("CREATE TABLE IF NOT EXISTS federated_credentials ( \
//     id INTEGER PRIMARY KEY, \
//     user_id INTEGER NOT NULL, \
//     provider TEXT NOT NULL, \
//     subject TEXT NOT NULL, \
//     UNIQUE (provider, subject) \
//   )");
  
//   db.run("CREATE TABLE IF NOT EXISTS todos ( \
//     id INTEGER PRIMARY KEY, \
//     owner_id INTEGER NOT NULL, \
//     title TEXT NOT NULL, \
//     completed INTEGER \
//   )");
// });


export default model;