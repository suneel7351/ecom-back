import mongoose from "mongoose";
export const dbConnect = async () => {
  const { connection } = await mongoose.connect(process.env.MONGO_URI);
  console.log(`Database connect successfully on ${connection.host}`);
};
