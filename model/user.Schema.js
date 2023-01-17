import mongoose from 'mongoose'

export const userSchema = new mongoose.Schema({
    Firstname: { type: String, min: 3 },
    Lastname: { type: String },
    address: { type: String },
    Gender: { type: String },
    DOB: { type: Date },
    Pincode: { type: Number },
    EmailID: { type: String },
    password: { type: String },
    status: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date() },
})
