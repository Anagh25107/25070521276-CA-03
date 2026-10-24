import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [120, "Title must be 120 characters or fewer"],
    },
    subject: { type: String, trim: true, default: "", maxlength: 80 },
    description: { type: String, trim: true, default: "", maxlength: 1000 },
    dueDate: { type: Date, default: null },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
