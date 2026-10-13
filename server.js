import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'todos.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Đảm bảo file todos.json tồn tại
async function initDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Đọc dữ liệu từ file
async function readTodos() {
  await initDataFile();
  const data = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// Ghi dữ liệu vào file
async function writeTodos(todos) {
  await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2), 'utf-8');
}

// API: Lấy danh sách todos
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await readTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Không thể đọc dữ liệu' });
  }
});

// API: Thêm todo mới
app.post('/api/todos', async (req, res) => {
  try {
    const { title, priority, dueDate } = req.body;
    if (!title || !priority) {
      return res.status(400).json({ error: 'Thiếu thông tin tiêu đề hoặc mức độ ưu tiên' });
    }
    const todos = await readTodos();
    const newTodo = {
      id: Date.now().toString(),
      title,
      priority,
      dueDate: dueDate || null,
      completed: false,
      createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    await writeTodos(todos);
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: 'Không thể thêm công việc mới' });
  }
});

// API: Cập nhật trạng thái hoặc thông tin todo
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, title, priority, dueDate } = req.body;
    const todos = await readTodos();
    const todoIndex = todos.findIndex(t => t.id === id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }

    if (completed !== undefined) todos[todoIndex].completed = completed;
    if (title !== undefined) todos[todoIndex].title = title;
    if (priority !== undefined) todos[todoIndex].priority = priority;
    if (dueDate !== undefined) todos[todoIndex].dueDate = dueDate;

    await writeTodos(todos);
    res.json(todos[todoIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Không thể cập nhật công việc' });
  }
});

// API: Xóa todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let todos = await readTodos();
    const initialLength = todos.length;
    todos = todos.filter(t => t.id !== id);
    
    if (todos.length === initialLength) {
      return res.status(404).json({ error: 'Không tìm thấy công việc để xóa' });
    }

    await writeTodos(todos);
    res.json({ success: true, message: 'Đã xóa công việc thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Không thể xóa công việc' });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
```

---