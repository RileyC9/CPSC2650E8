import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userLoginSchema = new Schema({
  _id: { type: String, required: true },
  displayName: { type: String, required: true },
  name: {
    familyName: { type:String },
    givenName: { type:String }
  }
})

const model = mongoose.model('Oauth', userLoginSchema);

export default model;