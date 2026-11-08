import mongoose from "mongoose";

const citySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  state: {
    type: String,
    default: ""
  },
  country: {
    type: String,
    default: "India"
  },
  latitude: Number,
  longitude: Number,
  population: Number,
  description: {
    type: String,
    default: ""
  },
  image: {
    type: String,
    default: ""
  },
  popularFor: {
    type: [String],
    default: []
  }
}, {
  versionKey: false,
  collection: "cities"
});

const City = mongoose.model("City", citySchema);

export default City;