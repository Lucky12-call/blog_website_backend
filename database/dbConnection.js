import mongoose from "mongoose";

export const dbConnection = async () => {
  try {
    const res = await mongoose.connect(process.env.MONGO_URI);

    console.log(`Connected to database! ${res.connection.host}`);
  } catch (error) {
    console.log(`error accrued white connecting to database ${error}`);
  }
};
