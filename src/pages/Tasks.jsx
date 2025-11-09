import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";

export default function Tasks() {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedToId: "",
    priority: "MEDIUM",
    dueDate: "",
    status: "PENDING",
    notes: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);

  const loadTasks = async () => {
    try {
      const res = await API.get("/tasks");
      setTasks(res.data);
    } catch (err) {
      toast.error("Failed to load tasks");
    }
  };

  const loadUsers = async () => {
    try {
      // Try to get users from auth endpoint or create a simple endpoint
      // For now, we'll make assignedTo optional
      setUsers([]);
    } catch (err) {
      console.log("Users endpoint not available");
    }
  };

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description,
        assignedToId: form.assignedToId || null,
        priority: form.priority,
        dueDate: form.dueDate || null,
        status: form.status,
        notes: form.notes || null,
      };
      await API.post("/tasks", payload);
      setForm({
        title: "",
        description: "",
        assignedToId: "",
        priority: "MEDIUM",
        dueDate: "",
        status: "PENDING",
        notes: "",
      });
      toast.success("Task created!");
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    }
  };

  const updateTask = async (id, updatedData) => {
    try {
      await API.put(`/tasks/${id}`, updatedData);
      toast.success("Task updated!");
      loadTasks();
      setEditingId(null);
      setSelectedTask(null);
      setForm({
        title: "",
        description: "",
        assignedToId: "",
        priority: "MEDIUM",
        dueDate: "",
        status: "PENDING",
        notes: "",
      });
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  const updateTaskStatus = async (id, newStatus) => {
    try {
      await API.put(`/tasks/${id}/status?status=${newStatus}`);
      toast.success(`Task status updated to ${newStatus}`);
      loadTasks();
    } catch (err) {
      toast.error("Failed to update task status");
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }
    try {
      await API.delete(`/tasks/${id}`);
      toast.success("Task deleted!");
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = (task) => {
    if (!task.dueDate || task.status === "COMPLETED") return false;
    return new Date(task.dueDate) < new Date();
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Task Management</h1>
          <p className="text-sm text-gray-500">Create, assign, and track operational tasks</p>
        </div>

        {/* Add Task Form */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? "Edit Task" : "Create New Task"}
          </h2>
          <form
            onSubmit={
              editingId
                ? (e) => {
                    e.preventDefault();
                    const task = tasks.find((t) => t.id === editingId);
                    updateTask(editingId, {
                      title: form.title || task.title,
                      description: form.description || task.description,
                      assignedToId: form.assignedToId || task.assignedTo?.id,
                      priority: form.priority || task.priority,
                      dueDate: form.dueDate || task.dueDate,
                      status: form.status || task.status,
                      notes: form.notes || task.notes,
                    });
                  }
                : addTask
            }
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                placeholder="Task title"
                className="input-field"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required={!editingId}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                placeholder="Task description"
                className="input-field"
                rows="3"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                className="input-field"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <input
                type="datetime-local"
                className="input-field"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                className="input-field"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To (Optional)</label>
              <input
                type="text"
                placeholder="User email or leave empty"
                className="input-field"
                value={form.assignedToId}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Note: User assignment by ID will be implemented</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                placeholder="Additional notes or validation comments"
                className="input-field"
                rows="2"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary flex-1">
                {editingId ? "Update Task" : "Create Task"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      title: "",
                      description: "",
                      assignedToId: "",
                      priority: "MEDIUM",
                      dueDate: "",
                      status: "PENDING",
                      notes: "",
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Search tasks..."
              className="input-field md:col-span-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              className="input-field"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Tasks ({filteredTasks.length} of {tasks.length})
          </h2>
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">
              No tasks yet. Create one above!
            </p>
          ) : filteredTasks.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">
              No tasks match your filters
            </p>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`border rounded-lg p-4 hover:border-gray-300 transition-all ${
                    isOverdue(task) ? "border-red-300 bg-red-50" : "border-gray-100 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-900">{task.title}</h3>
                        <span className={`badge ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className={`badge ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {isOverdue(task) && (
                          <span className="badge bg-red-100 text-red-800">Overdue</span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        {task.assignedTo && (
                          <span>
                            Assigned to: <span className="font-medium">{task.assignedTo.email || task.assignedTo.username || "N/A"}</span>
                          </span>
                        )}
                        {task.dueDate && (
                          <span>
                            Due: <span className="font-medium">{new Date(task.dueDate).toLocaleString()}</span>
                          </span>
                        )}
                        {task.createdAt && (
                          <span>
                            Created: <span className="font-medium">{new Date(task.createdAt).toLocaleDateString()}</span>
                          </span>
                        )}
                        {task.completedAt && (
                          <span className="text-green-600">
                            Completed: <span className="font-medium">{new Date(task.completedAt).toLocaleString()}</span>
                          </span>
                        )}
                      </div>
                      {task.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                          <span className="font-medium">Notes:</span> {task.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                        <>
                          {task.status === "PENDING" && (
                            <button
                              onClick={() => updateTaskStatus(task.id, "IN_PROGRESS")}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                            >
                              Start
                            </button>
                          )}
                          {task.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => updateTaskStatus(task.id, "COMPLETED")}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                            >
                              Complete
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                        }}
                        className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(task.id);
                          setForm({
                            title: task.title || "",
                            description: task.description || "",
                            assignedToId: task.assignedTo?.id || "",
                            priority: task.priority || "MEDIUM",
                            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "",
                            status: task.status || "PENDING",
                            notes: task.notes || "",
                          });
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Details Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Title</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedTask.title}</p>
                  </div>
                  {selectedTask.description && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Description</p>
                      <p className="text-base text-gray-700">{selectedTask.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <span className={`badge ${getStatusColor(selectedTask.status)}`}>
                        {selectedTask.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Priority</p>
                      <span className={`badge ${getPriorityColor(selectedTask.priority)}`}>
                        {selectedTask.priority}
                      </span>
                    </div>
                    {selectedTask.assignedTo && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Assigned To</p>
                        <p className="text-base text-gray-900">
                          {selectedTask.assignedTo.email || selectedTask.assignedTo.username || "N/A"}
                        </p>
                      </div>
                    )}
                    {selectedTask.dueDate && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Due Date</p>
                        <p className="text-base text-gray-900">
                          {new Date(selectedTask.dueDate).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedTask.createdAt && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Created At</p>
                        <p className="text-base text-gray-900">
                          {new Date(selectedTask.createdAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedTask.completedAt && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Completed At</p>
                        <p className="text-base text-green-600 font-medium">
                          {new Date(selectedTask.completedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedTask.notes && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Notes</p>
                      <p className="text-base text-gray-700 bg-gray-50 p-3 rounded">
                        {selectedTask.notes}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3 pt-4 border-t">
                    {selectedTask.status !== "COMPLETED" && selectedTask.status !== "CANCELLED" && (
                      <>
                        {selectedTask.status === "PENDING" && (
                          <button
                            onClick={() => {
                              updateTaskStatus(selectedTask.id, "IN_PROGRESS");
                              setSelectedTask(null);
                            }}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            Start Task
                          </button>
                        )}
                        {selectedTask.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => {
                              updateTaskStatus(selectedTask.id, "COMPLETED");
                              setSelectedTask(null);
                            }}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                          >
                            Complete Task
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => setSelectedTask(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

