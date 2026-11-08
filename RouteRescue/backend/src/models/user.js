import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  phone: {
    type: String,
    default: ""
  },

  passwordHash: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },

  preferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }

}, {
  versionKey: false
});

const User = mongoose.model("User", userSchema);

export default User;