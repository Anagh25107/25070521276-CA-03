import { Router } from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";

const router = Router();

function validId(id) {
  return mongoose.isValidObjectId(id);
}

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status === "pending") filter.completed = false;
    if (req.query.status === "completed") filter.completed = true;

    const q = String(req.query.q || "").trim();
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { subject: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const tasks = await Task.find(filter).sort({ completed: 1, dueDate: 1, createdAt: -1 });
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid task ID" });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { title, subject, description, dueDate, priority } = req.body;
    if (!String(title || "").trim()) {
      return res.status(400).json({ success: false, message: "Task title is required" });
    }
    const task = await Task.create({ title, subject, description, dueDate: dueDate || null, priority });
    res.status(201).json({ success: true, message: "Task created", data: task });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid task ID" });
    const { title, subject, description, dueDate, priority } = req.body;
    if (!String(title || "").trim()) {
      return res.status(400).json({ success: false, message: "Task title is required" });
    }
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, subject, description, dueDate: dueDate || null, priority },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, message: "Task updated", data: task });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/toggle", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid task ID" });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    task.completed = !task.completed;
    await task.save();
    res.json({ success: true, message: "Task status updated", data: task });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid task ID" });
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
